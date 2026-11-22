# Software Requirements Specification (SRS)
## rezoooo.me — AI Resume Analysis Platform

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for rezoooo.me, a web application that scores a resume against a job description and returns explainable results and improvement feedback. Heavy work runs asynchronously so it never blocks the API.

### 1.2 Scope
Authenticated users upload a resume (PDF, DOCX or TXT), submit a job description, and receive a score out of 100, three weighted sub-scores, matched and missing keywords, and prioritized AI feedback. Users can view history, re-analyze, delete analyses and delete their account.

### 1.3 Definitions
- AI: Artificial Intelligence. API: Application Programming Interface. OCR: Optical Character Recognition.
- ARQ: asyncio job queue for Python on Redis. JWKS: JSON Web Key Set. JSONB: binary JSON in PostgreSQL.
- Analysis: one resume evaluated against one job description.
- Sub-scores: semantic, entity coverage and LLM fit.

### 1.4 References
- SmartResume project report (predecessor system).
- rezoooo.me design project "App design | rezoooo.me" (final UI, tokens, states).
- FastAPI, ARQ, Neon (Postgres, Object Storage, Auth) and Tesseract documentation.

## 2. Overall Description

### 2.1 Product Perspective
A full-stack web app: Next.js frontend, FastAPI backend, ARQ workers on Redis, Neon Postgres (`18.7`) and Object Storage (`ap-southeast-1`), Neon Auth (`@neon/auth`) for sign-in, OpenRouter (`inclusionai/ling-3.0-flash-vl` via OpenAI-compatible SDK, fallback `qwen/qwen3.8-flash`) for LLM calls, and a local sentence-transformers model for embeddings.

### 2.2 Product Functions
- Sign up and sign in with Google, GitHub or email and password.
- Accept and validate uploads and job descriptions.
- Queue analyses and process them in background workers.
- Extract text natively, falling back to OCR for scans.
- Extract entities, compute sub-scores and a final score, generate feedback.
- Show live status, results, history, usage and account settings.

### 2.3 User Classes
- Job seekers: upload resumes and expect results in 20 to 60 seconds.
- Maintainers: monitor queue depth, failures and costs.

### 2.4 Operating Environment
Modern desktop and mobile browsers (planned production origin `https://rezoooo-me.vercel.app`, local development `http://localhost:3000`; origins configured via environment variables). Python 3.12 backend. Redis broker (Docker locally on host port `6380`, Upstash in production). Tesseract installed on OCR workers (on Windows dev, configure `TESSERACT_CMD` if `tesseract.exe` is not on `PATH`; default OCR render scale 200 DPI).

### 2.5 Constraints
- Heavy work shall not run inside request handlers.
- Queue payloads carry identifiers only, never files or text.
- Uploaded files are private and are removed when the analysis or account is deleted.
- LLM access depends on OpenRouter rate limits and upstream provider availability (`inclusionai/ling-3.0-flash-vl` currently has a single upstream provider, `DeepInfra`, requiring failover to `qwen/qwen3.8-flash` on provider outage).

### 2.6 Assumptions and Dependencies
- OpenRouter supports the OpenAI-compatible endpoint and structured output (`inclusionai/ling-3.0-flash-vl` verified in Phase 0b Spike 1: inlined-schema `tool_calling` + `reasoning.enabled=False` + `max_tokens=4096` + `data_collection="deny"` achieved `20/20` valid at `p50=10.85s`, `p95=18.02s`, vs `13/20` under strict `json_schema` due to DeepInfra whitespace repetition loops; fallback `qwen/qwen3.8-flash` verified with `data_collection="deny"` + `4096`).
- Neon Auth supports Google (Neon shared dev credentials; own Google OAuth client required before production launch), GitHub (configured in Neon Console, `HTTP 200 -> 302` verified; interactive E2E sign-in in Phase 1), email + password, verified-email implicit linking, and 15-minute `EdDSA` (`Ed25519`) JWT verification via JWKS in FastAPI (live JWKS, JWT verification, and `neon_auth.user.id` `UUID` verified in Phase 0b Spike 2). Because `POST /delete-user` returned `404` in Spike 2b, `DELETE /me` deletes stored files and app rows plus `neon_auth."user"` via transactional SQL (`ON DELETE CASCADE`), and FastAPI rejects tokens belonging to deleted users before the 15-min JWT expires.
- Neon Object Storage beta is verified live in `ap-southeast-1` (Singapore, nearest to Hyderabad) via path-style SigV4 S3 API with private HTTP `403` refusal (`LocalDiskStorage` covers dev). Neon Postgres `18.7` (`pgvector 0.8.7` available) is verified live for direct DDL and pooled `-pooler` async queries (`statement_cache_size=0`).
- Upstash Redis free tier is 500,000 commands/month; production ARQ `poll_delay` must be tuned (e.g., `15.0s` for 2 free-tier workers, ~345.6k idle cmds/month) or upgraded to Upstash PAYG for sub-2s queue pickup.
- Scan quality limits OCR accuracy (`200 DPI` achieves ~99.7% vocab recall at ~2.36s/page on clean scans).

## 3. Specific Requirements

### 3.1 External Interfaces
- UI: screens as defined in the design project, desktop and mobile, light mode, WCAG AA contrast, visible focus, reduced-motion and reduced-transparency fallbacks.
- REST API: POST /analyses, GET /analyses/{id}, GET /analyses?status=, DELETE /analyses/{id}, POST /analyses/{id}/retry, GET /me/usage, DELETE /me.
- Communications: HTTPS between browser and API.

### 3.2 Functional Requirements

Authentication
- FR-1: The system shall support sign-in with Google, GitHub and email and password.
- FR-2: The system shall require sign-in before any upload, analysis or history access.
- FR-3: The system shall auto-link accounts only when the provider reports a verified email.
- FR-4: The system shall return 404 when a user requests an analysis they do not own.

Upload and validation
- FR-5: The system shall accept PDF, DOCX and TXT, determined by magic bytes, not extension.
- FR-6: The system shall enforce a 4 MB hard cap by aborting the stream with HTTP 413.
- FR-7: The system shall reject PDFs over about 5 pages and DOCX files whose text exceeds a configured limit.
- FR-8: The system shall require a job description of 10 to 5,000 characters and a role name.
- FR-9: The system shall return stable error codes: file_too_large, unsupported_type, too_many_pages, jd_too_short, daily_limit_reached.

Rate limiting
- FR-10: The system shall allow 10 accepted analyses per user per day, counted at upload acceptance.
- FR-11: The counter shall be atomic in Redis and mirrored in Postgres so a Redis flush cannot reset quotas.
- FR-12: The system shall show used count and time until reset (Asia/Kolkata midnight, configurable).
- FR-13: A job that fails for a system reason shall not consume quota (configurable default).

Processing
- FR-14: The API shall create an analysis row, store the file, enqueue the job and return 202 without waiting for processing.
- FR-15: The worker shall extract text natively first and use Tesseract only when the native text is below a minimum length.
- FR-16: OCR jobs shall run on a separate `ocr` queue.
- FR-17: The system shall cache extracted text and entities by file hash.
- FR-18: The worker shall extract resume and job entities with an LLM against a Pydantic schema, validate the output and retry once on invalid output.
- FR-19: Resume and job text shall be treated as data inside delimited blocks, and instructions inside them shall not alter output format or score.
- FR-20: The system shall compute semantic, entity coverage and LLM-fit sub-scores and a final score (section 3.3).
- FR-21: The system shall generate feedback: overall assessment, strengths, prioritized improvements (critical, high, medium, each with an impact line) and ATS tips.
- FR-22: The system shall retry transient failures with exponential backoff and cap concurrent LLM calls.

Status and results
- FR-23: The system shall expose statuses queued, extracting, embedding, analyzing, done and failed. The UI shall show Queued, Extracting, Analyzing and Done.
- FR-24: The frontend shall poll status about every 2 seconds.
- FR-25: The system shall show OCR and queue-delayed variants of the Processing screen when applicable.
- FR-26: The system shall list analyses with per-status counts, allow re-analysis, retry of failed jobs and deletion.
- FR-27: The system shall delete stored files and text when an analysis or account is deleted.

### 3.3 Scoring Requirements
- final_score = round(0.40 x semantic + 0.30 x entity + 0.30 x llm), with weights configurable.
- semantic is cosine similarity of full-text embeddings rescaled to 0-100 (provisional 0.20 to 0, 0.70 to 100, clipped) and calibrated before release.
- entity is the percentage of required job entities matched, by normalised match or embedding similarity above a threshold (default 0.75).
- The system shall store all sub-scores, the raw cosine and the weights used with every result, and the UI shall display the weights.

### 3.4 Performance Requirements
- Sustain about 50 analyses per minute with 2 workers, roughly 10 to 15 concurrent jobs each.
- Typical analysis completes in 20 to 60 seconds; scanned PDFs may take longer.
- The API acknowledges uploads without waiting for workers; valid uploads are queued, not rejected, when workers are busy.
- Worker concurrency is configurable per queue.

### 3.5 Logical Database Requirements
See database_design.md. Postgres is the source of truth; Redis holds only transient jobs and the quota counter mirror.

### 3.6 Software System Attributes

Reliability: stage status, per-stage retries and the file-hash cache mean an LLM failure does not require re-extraction or re-upload.
Availability: the API stays responsive when the queue is backed up.
Security: private storage; HTTPS; token verification on every request; per-user scoping; CORS limited to the web origin; no resume text in logs; resume auto-deletion after a configurable retention period (default 30 days).
Maintainability: Storage, Embedder and LLMClient interfaces; modular API, worker, extraction, scoring and persistence code.
Portability: containerised local setup with Docker Compose.
Accessibility: WCAG AA, labelled inputs, real buttons and links.

## 4. Appendices

### 4.1 Future Enhancements
- Server-sent events or WebSockets instead of polling.
- Batch uploads and resume version comparison.
- Section-level scoring and skill-gap heatmaps.
- API-based embeddings and a dedicated vector index (pgvector) if needed.
