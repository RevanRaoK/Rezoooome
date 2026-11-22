# Phase 0 & 0b Verification Spikes (`rezoooo.me`)

Throwaway verification scripts and sample-generator utilities for Phase 0 and Phase 0b. Do not import from `/spikes` in production code.

## Setup (Windows PowerShell)

```powershell
py -3.12 -m venv spikes\.venv
.\spikes\.venv\Scripts\python.exe -m pip install --upgrade pip
.\spikes\.venv\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.\spikes\.venv\Scripts\python.exe -m pip install -r spikes\requirements.txt
```

Copy `.env.example` to `.env` at the repo root and fill in real values locally before running credentialed spikes (Spikes 1, 2, 2b, 3, and 8). Never commit `.env` or generated `spikes/samples/sample_*` files.

## Generating Sanitized Samples

```powershell
.\spikes\.venv\Scripts\python.exe spikes\samples\generate_samples.py
```

Writes gitignored local fixtures (`sample_resume.txt`, `sample_jd.txt`, `sample_resume.pdf`, `sample_resume.docx` with paragraphs + table, and 2-page raster-only `sample_scanned_resume.pdf`).

## Commands Run (Phase 0 & Phase 0b)

```powershell
# Spike 1: OpenRouter LLM structured output & 20-call reliability benchmark
.\spikes\.venv\Scripts\python.exe -u spikes\spike1_openrouter_llm.py

# Spike 2: Neon Auth live JWKS, OAuth providers (Google/GitHub), 15-min EdDSA JWT + FastAPI check
.\spikes\.venv\Scripts\python.exe spikes\spike2_neon_auth.py

# Spike 2b: Neon Auth user account deletion (/delete-user 404 vs SQL ON DELETE CASCADE)
.\spikes\.venv\Scripts\python.exe spikes\spike2b_neon_delete_user.py

# Spike 3: Neon Object Storage S3 boto3 roundtrip (ap-southeast-1, path-style SigV4)
.\spikes\.venv\Scripts\python.exe spikes\spike3_neon_storage.py

# Spike 4 / Phase 0b Spike 5: Redis (port 6380) & native Windows ARQ worker (+ idle poll benchmark)
docker compose -f spikes\docker-compose.redis.yml up -d
.\spikes\.venv\Scripts\python.exe spikes\spike4_arq_redis.py          # full 120s idle command-rate benchmark
.\spikes\.venv\Scripts\python.exe spikes\spike4_arq_redis.py --quick  # quick roundtrip check on port 6380
docker compose -f spikes\docker-compose.redis.yml down

# Spike 5: Tesseract OCR (checks PATH, falls back to C:\Program Files\Tesseract-OCR\tesseract.exe, 200 vs 300 DPI)
.\spikes\.venv\Scripts\python.exe spikes\spike5_tesseract_ocr.py

# Spike 6: pdfplumber + python-docx extraction
.\spikes\.venv\Scripts\python.exe spikes\spike6_extractors.py

# Spike 7: Local sentence-transformers/all-MiniLM-L6-v2 on CPU
.\spikes\.venv\Scripts\python.exe spikes\spike7_embeddings.py

# Spike 8 (Phase 0b Spike 4): Neon Postgres direct DDL + pooled async concurrency
.\spikes\.venv\Scripts\python.exe spikes\spike8_postgres.py
```

## Phase 0 & 0b Observed Results (2026-11-22)

| Spike | Status | Observed Result |
|---|---|---|
| 1. OpenRouter LLM (`inclusionai/ling-3.0-flash-vl`) | Pass (`tool_calling`) | Sole provider `DeepInfra` (`deepinfra`, `fp4`, 131k ctx, `$0.06/$0.18` per 1M). `data_collection="deny"` (`allow_fallbacks=False`) returned `HTTP 200` on `DeepInfra`. Strict `json_schema` hit `\n`/`\t` repetition loops (`13/20`); **inlined-schema `tool_calling`** (`reasoning.enabled=False`, `max_tokens=4096`) scored **`20/20`** (`p50=10.85s`, `p95=18.02s`, `3177.1` avg tokens, `$0.000304/call`, injections `fit=0..5`). `0.05s` timeout -> `APITimeoutError`; `ignore=["deepinfra"]` -> `HTTP 404`; fallback `qwen/qwen3.8-flash` `data_collection="deny"` (`4096`) -> `HTTP 200` (`Alibaba`, `28.64s`, `$0.001013/call`). |
| 2. Neon Auth | Pass (live) | Live `/.well-known/jwks.json` HTTP `200` (`OKP`/`Ed25519`/`EdDSA`), `GET /ok` `200`, 15-min (`ttl_s=900`) `EdDSA` JWT verified via FastAPI `PyJWKClient` (`200`), `neon_auth.user.id` = `uuid`. GitHub social initiation `HTTP 200 -> 302 github.com` (configured; E2E in Phase 1). Google runs on Neon shared dev creds (`302 accounts.google.com` via shared regional proxy callback). |
| 2b. Account Deletion | Pass (`SQL cascade`) | `POST /delete-user` returned `HTTP 404` across cookie, bearer session, and bearer JWT. Transactional SQL `DELETE FROM neon_auth."user" WHERE id = $1` cascaded `account`, `session`, `member`, `invitation` (`(1,1,1)->(0,0,0)`), invalidated `/get-session`, and rejected `/sign-in/email` (`401`). |
| 3. Neon Object Storage | Pass (live) | `ap-southeast-1` `head_bucket` `True` (`483.4ms`); unauthenticated `GET` refused `403` (object & bucket); `put_object` `215.4ms`, `get_object` `106.9ms`, `delete_object` `145.6ms`, `head_object` `404`. |
| 4. Redis & ARQ (`6380`) | Pass (live) | Native Windows `arq.exe` on `127.0.0.1:6380:6379` (`redis:7-alpine` `7.4.9`): `0.44s` pickup, `0.00s` run (`--quick`). Idle `ZRANGEBYSCORE`: `118/min` (`0.5s`), `12/min` (`5.0s`), `4/min` (`15.0s` = `345.6k/mo` for 2 workers, `69.1%` of Upstash 500k free tier). |
| 5. Tesseract OCR | Pass | Not on `PATH`; `v5.5.0.20241111` at `C:\Program Files\Tesseract-OCR\tesseract.exe`. 200 DPI = `2.36s/pg` (`99.7%` recall); 300 DPI = `3.56s/pg` (`99.7%` recall). |
| 6. Extraction | Pass | `pdfplumber`: 2 pages, 909 words in `139.8ms`. `python-docx`: paragraphs + tables, 947 words in `32.2ms`. |
| 7. Embeddings | Pass | `all-MiniLM-L6-v2` (dim 384) on CPU: `7.48s` first load, `1.10s` warm load, `34.4ms` avg resume, `29.5ms` avg JD, `raw_cosine=0.7757`. |
| 8. Neon Postgres (`18.7`) | Pass (live) | Direct DDL cycle (`489.5ms`) on `PostgreSQL 18.7` (`pgvector 0.8.7` available); pooled `-pooler` 5-concurrent async (`1052.8ms`, `statement_cache_size=0`). |
