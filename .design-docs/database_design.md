# Database Design — rezoooo.me

## Overview
Neon Postgres is the system of record. Redis only moves jobs and keeps a fast daily-quota counter; nothing user-facing lives only in Redis. Flexible AI output is stored as JSONB, while ownership, status and scores are ordinary columns.

## Design goals
- One durable row per analysis with a clear lifecycle and visible failure reasons.
- Retries without re-upload or re-extraction (file-hash cache).
- Ownership enforced on every query (`user_id`), 404 for other users' rows.
- Quota that survives a Redis flush.
- Easy deletion of one analysis or a whole account.

## Users
Users are managed by Neon Auth (Managed Better Auth), which keeps its data in the `neon_auth` schema. The app does not duplicate a users table. Phase 0b live Postgres inspection (`PostgreSQL 18.7`, `pgvector 0.8.7` available) verified that `neon_auth.user.id` is `UUID` and that `neon_auth.{account, session, member, invitation}` all reference `neon_auth."user"(id) ON DELETE CASCADE`. However, `user_id` columns in app tables remain `TEXT` holding the canonical UUID string with no cross-schema foreign key so the schema stays identical without migrations if auth ever moves into self-managed Better Auth inside Next.js.

## Tables

### analyses
One resume evaluated against one job description.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | Returned to the client on upload. |
| user_id | TEXT NOT NULL | Auth user id. |
| role | TEXT NOT NULL | Target role, max 120 chars. |
| jd_text | TEXT NOT NULL | Job description, 10 to 5,000 chars. |
| file_key | TEXT NOT NULL | Object storage key (or local path in dev). |
| file_name | TEXT NOT NULL | Original name for display. |
| file_hash | TEXT NOT NULL | SHA-256 of the file, used by the cache. |
| mime | TEXT NOT NULL | Detected from magic bytes. |
| page_count | INT | PDF pages when known. |
| status | TEXT NOT NULL | queued, extracting, embedding, analyzing, done, failed. |
| error_code | TEXT | e.g. ocr_timeout, llm_timeout, llm_invalid_output, corrupt_file, empty_extraction. |
| ocr_used | BOOLEAN DEFAULT FALSE | Drives the OCR variant of the Processing screen. |
| semantic_score | NUMERIC(5,2) | 0-100 after rescale. |
| raw_cosine | NUMERIC(6,4) | Stored for calibration. |
| entity_score | NUMERIC(5,2) | 0-100. |
| llm_score | NUMERIC(5,2) | 0-100. |
| final_score | NUMERIC(5,2) | Weighted result. |
| weights | JSONB | Weights used, e.g. {"semantic":0.40,"entity":0.30,"llm":0.30}. |
| result_json | JSONB | Matched and missing keywords, assessment, strengths, improvements (title, priority, impact, detail), ATS tips, LLM justification, model name. |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| started_at | TIMESTAMPTZ | Worker start. |
| finished_at | TIMESTAMPTZ | Done or failed time. |

UI mapping: queued = Queued; extracting = Extracting; embedding and analyzing = Analyzing; done = Done; failed = Failed.

### usage_daily
Durable mirror of the per-user daily counter.

| Column | Type | Notes |
|---|---|---|
| user_id | TEXT | Part of PK. |
| day | DATE | Local day in Asia/Kolkata (configurable). Part of PK. |
| count | INT NOT NULL DEFAULT 0 | Accepted analyses that day; limit 10. |

### resume_cache
Avoids repeating extraction and entity work for the same file.

| Column | Type | Notes |
|---|---|---|
| file_hash | TEXT PK | SHA-256. |
| extracted_text | TEXT NOT NULL | Cleaned text. |
| entities_json | JSONB | Skills, tools, education, experience. |
| ocr_used | BOOLEAN | |
| created_at | TIMESTAMPTZ DEFAULT now() | Purged with the retention job. |

## Relationships
- One user has many analyses and one usage row per day.
- One analysis refers to one stored file and optionally one cache row by hash.
- Re-analysis creates a new analysis row and counts against the daily limit.
- Retry of a failed analysis reuses the same row and does not consume extra quota.

## Constraints and indexes
- CHECK on `status` for the allowed values.
- Index `analyses (user_id, created_at DESC)` for History.
- Index `analyses (user_id, status)` for tab counts.
- Index `analyses (status, created_at)` for queue monitoring and the queue-delayed threshold.
- Index `analyses (created_at)` for the retention job.

## SQL skeleton
```sql
CREATE TABLE analyses (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    jd_text TEXT NOT NULL,
    file_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    mime TEXT NOT NULL,
    page_count INT,
    status TEXT NOT NULL CHECK (status IN ('queued','extracting','embedding','analyzing','done','failed')),
    error_code TEXT,
    ocr_used BOOLEAN NOT NULL DEFAULT FALSE,
    semantic_score NUMERIC(5,2),
    raw_cosine NUMERIC(6,4),
    entity_score NUMERIC(5,2),
    llm_score NUMERIC(5,2),
    final_score NUMERIC(5,2),
    weights JSONB,
    result_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);
CREATE INDEX analyses_user_created ON analyses (user_id, created_at DESC);
CREATE INDEX analyses_user_status ON analyses (user_id, status);
CREATE INDEX analyses_status_created ON analyses (status, created_at);
CREATE INDEX analyses_created_at ON analyses (created_at);

CREATE TABLE usage_daily (
    user_id TEXT NOT NULL,
    day DATE NOT NULL,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day)
);

CREATE TABLE resume_cache (
    file_hash TEXT PRIMARY KEY,
    extracted_text TEXT NOT NULL,
    entities_json JSONB,
    ocr_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Quota rule
On upload acceptance, increment the Redis counter atomically (expiring at the day boundary) and upsert `usage_daily`. If Redis is empty after a flush, rebuild the counter from `usage_daily`. When a job fails for a system reason (not a bad file), decrement both. Reject with `daily_limit_reached` at 10.

## Retention and deletion
- Deleting an analysis removes its row and its stored file.
- Deleting an account (`DELETE /me`) removes all stored files, `analyses`, and `usage_daily` rows for that user and deletes the auth user via transactional SQL `DELETE FROM neon_auth."user" WHERE id = $1` (verified `ON DELETE CASCADE` in Spike 2b after `POST /delete-user` returned `404`). FastAPI's token check must also reject JWTs for users who no longer exist because 15-min JWTs remain valid until `exp`.
- A scheduled job removes files, extracted text and cache rows older than N days (default 30).

## Rationale
Compared with the earlier four-table design (uploads, parsed_resumes, analysis_requests, analysis_outputs), a single `analyses` table is enough because there is one stage pipeline per request, and the file-hash cache gives the same retry benefit as storing parsed text separately. If re-analysis with new models, audit logs or per-section scores are needed later, split result data into its own table without changing the API.
