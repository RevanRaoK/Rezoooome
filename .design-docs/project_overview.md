# rezoooo.me — Project Overview

rezoooo.me is an AI resume analysis web app. A signed-in user uploads a resume (PDF, DOCX or TXT), pastes a job description, and receives a score out of 100 with an explanation of how the score was reached, matched and missing keywords, and prioritized improvement feedback.

It is the next iteration of SmartResume (React, FastAPI, Supabase, Gemini, Sentence-BERT). SmartResume processed one resume at a time per server, so concurrent users hit timeouts and rate limits. It also produced junk keywords from stock spaCy NER and showed a score (69%) that contradicted its own sub-scores (0.390 semantic, 15% keyword coverage). rezoooo.me fixes all three.

## Goals
- Queue-based ingestion so many users can be served at once. Target: sustain about 50 analyses per minute with 2 workers.
- A score that is explainable: three weighted sub-scores, shown to the user with their weights.
- Keyword and entity extraction done by an LLM against a schema, not by stock NER.
- Native text extraction first, Tesseract OCR only when native extraction yields too little text.
- Per-user limits: 4 MB upload, about 5 pages, 10 analyses per day.

## Architecture
- Frontend: Next.js (App Router, TypeScript strict) and Tailwind CSS (Phase 1+). Light mode only. Design is final and lives in `/design` (`design/rezoooo.me/tokens.json`, `design/rezoooo.me/tokens.css`, `design/rezoooo.me/README.md`, `design/rezoooo.me/assets/Logos/`, and `design/App design rezoooo.me.html` containing all 46 desktop/mobile boards and states). Deployed on Vercel with Root Directory = `/web`; planned prod domain: `https://rezoooo-me.vercel.app` (local dev `http://localhost:3000`); never hard-code any domain in code. Reaches `/api` via `NEXT_PUBLIC_API_URL`.
- API: FastAPI. Validates the upload, stores the file, writes the database row, enqueues a job carrying only the analysis id, and answers status requests.
- Queue: ARQ on Redis (Docker locally on host port `6380` via `127.0.0.1:6380:6379`, Upstash in production). Two queues: `default` and `ocr`, so slow scans never block normal jobs. Note: Upstash's free tier is capped at **500,000 commands/month** (`~11.57 cmds/min`); ARQ's default `poll_delay=0.5s` emits `118 cmds/min` per idle worker (`~10.2M/month` for 2 workers). On Upstash free tier, set `poll_delay=15.0s` (`~345.6k/month` for 2 workers) or `12.0s`/`25.0s`, and move to Upstash Pay-As-You-Go if sub-2s queue pickup is needed.
- Workers: one pipeline job per analysis with stages extracting, embedding, analyzing. CPU-bound work (embeddings, OCR) runs in thread pools. About 10 jobs per worker, 2 workers to start. LLM calls are concurrency-capped and retried with backoff.
- Database and storage: Neon Postgres (`PostgreSQL 18.7`, `pgvector 0.8.7` available, pooled `-pooler` queries with `statement_cache_size=0`), Neon Object Storage (S3-compatible, beta; nearest supported region to Hyderabad is **`ap-southeast-1`**, requiring SigV4 and path-style addressing; private refusal + S3 roundtrip verified live) behind a `Storage` interface, `LocalDiskStorage` in development.
- Auth: Google (currently Neon shared dev credentials; own Google OAuth client required before launch), GitHub (custom OAuth app configured in Neon Console, end-to-end check in Phase 1) and email + password, through Neon Auth (`@neon/auth`, Managed Better Auth). Issues 15-minute `EdDSA` (`Ed25519`) JWTs verified statelessly by FastAPI via `/.well-known/jwks.json` (`PyJWT[crypto]`) and scopes every query by `user_id` (`404` on non-owned rows). `DELETE /me` deletes stored files, `analyses`, `usage_daily`, and `neon_auth."user"` via SQL (`ON DELETE CASCADE`); FastAPI's token check also rejects tokens for deleted users before 15-min JWT expiry. Implicit OAuth account linking runs only when the provider reports a verified email.
- LLM: OpenAI Python SDK with `base_url` pointed at **OpenRouter** (`inclusionai/ling-3.0-flash-vl`, `$0.06/1M` in / `$0.18/1M` out). Uses **inlined-schema `tool_calling`** (`reasoning.enabled=False`, `max_tokens=4096`, `data_collection="deny"`) + Pydantic v2 validation + 1 repair retry (`20/20` valid, `p50=10.85s`, `p95=18.02s`, `~$0.00030/call`). Note single-provider risk: `DeepInfra` (`deepinfra`) is the sole provider for Ling (falls back to `qwen/qwen3.8-flash` on `Alibaba` if DeepInfra is unavailable).
- Embeddings: local `all-MiniLM-L6-v2` by default behind an `Embedder` interface, so an API embedder can replace it by configuration.
- Status delivery: polling `GET /analyses/{id}` about every 2 seconds. No push channel in version 1.

## Request flow
1. The user submits role, job description and file. FastAPI streams the upload (abort at 4 MB), checks magic bytes, page count and quota.
2. The file goes to object storage. An `analyses` row is created with status `queued`. The job id goes to ARQ.
3. A worker extracts text natively. If the text is too short, the job moves to the `ocr` queue and Tesseract runs. Results are cached by file hash.
4. The worker embeds the full resume and job description, extracts entities with the LLM, matches required entities, and asks the LLM for a fit score and structured feedback.
5. Sub-scores and the final score are stored. The UI polls, then shows the Result page.

## Scoring
final = round(0.40 x semantic + 0.30 x entity coverage + 0.30 x LLM fit)
- Semantic: cosine similarity of full-text embeddings, rescaled to 0-100. Provisional mapping 0.20 to 0 and 0.70 to 100, to be calibrated on 10 to 15 real resume and job pairs.
- Entity coverage: share of required job entities found in the resume, by normalised match or embedding similarity above a threshold. Matched and missing lists are returned.
- LLM fit: 0-100 with a written justification.
All sub-scores and the weights used are stored with each result. Worked example from the design: 82 x 0.40 + 71 x 0.30 + 80 x 0.30 is about 78.

## Why two queues is now `default` and `ocr`
The earlier plan used `resume_parse` and `resume_analyze` queues. The final design keeps stage isolation through database status, the file-hash cache and retries per stage, but splits queues only where workloads differ most: OCR is slow and CPU-bound, everything else is short.

## Phase 0 / 0b Verification Status & Open Phase 1–3 Items
- **OpenRouter LLM (verified in Spike 1):** `inclusionai/ling-3.0-flash-vl` works via OpenRouter (`DeepInfra`, honors `data_collection="deny"`), achieving `20/20` valid via inlined `tool_calling` (`p50=10.85s`, `p95=18.02s`). Strict `json_schema` hit DeepInfra `\n`/`\t` repetition loops (`13/20`). Fallback `qwen/qwen3.8-flash` handles DeepInfra outages (`HTTP 404` when ignored).
- **Neon Auth & Account Deletion (verified in Spikes 2 & 2b):** Live JWKS (`EdDSA`), real JWT verification, and SQL cascade deletion (`DELETE FROM neon_auth."user"`) verified (`POST /delete-user` is `404`). GitHub OAuth initiation returns `HTTP 200 -> 302 github.com` (Phase 1: verify interactive E2E sign-in). Pre-launch: swap Google from Neon shared dev credentials to own OAuth client and disable `Allow Localhost` on prod branch.
- **Neon Object Storage & Postgres (verified in Spikes 3 & 8):** `ap-southeast-1` private `403` + S3 roundtrip passed; `PostgreSQL 18.7` DDL & pooled async queries (`statement_cache_size=0`) passed.
- **Redis `6380` & Upstash budget (verified in Spike 4):** Native Windows `arq.exe` passed on port `6380`; idle ARQ commands `118/min` (`0.5s`) vs `4/min` (`15.0s`).
- **Calibration (Phase 3):** Spike 7 observed `raw_cosine=0.7757` on a realistic match (exceeding provisional `0.70 -> 100` clip); calibrate similarity rescale and entity threshold in Phase 3 (`SCORING.md`).
