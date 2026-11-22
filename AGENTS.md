# AGENTS.md — rezoooo.me

## Project Summary
`rezoooo.me` is an AI resume analysis web app. Signed-in users upload a resume (PDF, DOCX, or TXT; max 4 MB, ~5 pages), supply a target role (max 120 chars) and job description (10–5,000 chars), and receive an explainable 0–100 score, three weighted sub-scores, matched/missing keywords, and prioritized feedback. Quota: 10 analyses/user/day. Status updates use ~2s polling (`GET /analyses/{id}`), with no push channel in v1.

## Stack
- **Frontend:** Next.js App Router (`Next.js 16.4.6`, `React 19.3.1`, TypeScript strict), Tailwind CSS (`4.3.5`), light mode only, Plus Jakarta Sans. (`/web` implements the Phase 1 landing page, Neon Auth flows, and app shell.)
- **API & Workers:** FastAPI (Python 3.12), Pydantic v2, SQLAlchemy 2 async, Alembic; ARQ on Redis (Docker locally on host port `6380`, Upstash in prod) with queues `default` and `ocr`.
- **Database & Storage:** Neon Postgres `18.7` (system of record); Neon Object Storage (`ap-southeast-1`, SigV4 + path-style S3) behind `Storage` interface (`LocalDiskStorage` in dev).
- **Auth:** Neon Auth (`@neon/auth`, Managed Better Auth) with Google, GitHub, and email + password; FastAPI verifies 15-min `EdDSA` JWTs via JWKS and rejects tokens for deleted users.
- **AI & Extraction:** OpenAI Python SDK (`base_url` -> OpenRouter, `inclusionai/ling-3.0-flash-vl` via inlined-schema `tool_calling` with `data_collection: "deny"`, fallback `qwen/qwen3.8-flash`) behind `LLMClient`; `pdfplumber` + `python-docx` first, `pypdfium2` + `pytesseract` OCR fallback; local `all-MiniLM-L6-v2` behind `Embedder`.

## Repo Layout & Domains
- `/web` — Next.js App Router frontend and Vercel Root Directory (Vercel builds `/web` only)
- `/api` — FastAPI backend, ARQ workers, Alembic migrations (Phase 1+; hosting undecided until Phase 5; `/web` calls `/api` via `NEXT_PUBLIC_API_URL`)
- `/design` — Final Claude Design specs (`design/rezoooo.me/tokens.json`, `tokens.css`, `README.md`, `assets/Logos/`, `design/App design rezoooo.me.html`)
- `/spikes` — Phase 0 / 0b verification spikes (`spikes/.venv` gitignored)
- `/.design-docs` — Architecture, SRS, database design (keep `_archive/` untracked)
- `/docker-compose.yml` — Local services mapping Redis `127.0.0.1:6380:6379` (Phase 1+)
- **Deployment Domains & Origins:** Planned prod URL `https://rezoooo-me.vercel.app` (Vercel project builds `/web`; optional custom domain added later in Vercel Domains while `.vercel.app` alias keeps working); local dev URL `http://localhost:3000`. Use `rezoooo.me` strictly as product name and wordmark; never hard-code any domain in code (read origins from env vars).

## Windows PowerShell Commands
Use PowerShell syntax (Python `3.12.10`, Node `26.13.1` Active LTS via `fnm` + `/web/.nvmrc` matching Vercel `26.x` — global Node remains `v25.8.2`; Docker `29.6.2`, Compose `v5.3.1`; `uv` and `pnpm` are not installed; `;` chains commands in PowerShell 5.1).
- **Spikes venv install (verified):** `py -3.12 -m venv spikes\.venv; .\spikes\.venv\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu; .\spikes\.venv\Scripts\python.exe -m pip install -r spikes\requirements.txt`
- **Spikes live runs (verified):** `.\spikes\.venv\Scripts\python.exe spikes\spike1_openrouter_llm.py` | `spike2_neon_auth.py` | `spike2b_neon_delete_user.py` | `spike3_neon_storage.py` | `spike5_tesseract_ocr.py` | `spike6_extractors.py` | `spike7_embeddings.py` | `spike8_postgres.py`
- **Spike Redis & native ARQ worker on port 6380 (verified):** `docker compose -f spikes\docker-compose.redis.yml up -d; .\spikes\.venv\Scripts\python.exe spikes\spike4_arq_redis.py`
- **Tesseract Windows path (verified):** Not on `PATH`; binary is at `C:\Program Files\Tesseract-OCR\tesseract.exe` (`v5.5.0.20241111`), set `TESSERACT_CMD` env var.
- **`/web` build, lint, typecheck & Playwright (verified on Node `26.13.1` via `fnm`):** `Set-Location web; fnm use; npm install; npm run lint; npm run typecheck; npm run build; npx playwright test` (`npm run dev` unverified; Phase 1 E2E ran via `next start`)
- **`/api` install, test, lint & run (verified):** `Set-Location api; py -3.12 -m venv .venv; .\.venv\Scripts\python.exe -m pip install -r requirements.txt; .\.venv\Scripts\pytest.exe; .\.venv\Scripts\ruff.exe check .; .\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000`
- **Root Redis & app ARQ workers (unverified runtime; `docker compose config -q` verified):** `docker compose up -d redis` | `Set-Location api; .\.venv\Scripts\arq.exe app.workers.default.WorkerSettings` (and `.ocr.WorkerSettings`)

## Coding Conventions & Hard Rules
- **TypeScript / Python:** TS `strict: true` with explicit API types; Python 3.12 typed + Pydantic v2 for LLM outputs + `async` everywhere; isolate backends behind `Storage`, `Embedder`, `LLMClient`.
- **UI & Brand:** Always use `frontend-design` skill with `/design` tokens applied on top; never redesign screens. Brand name is always lowercase `rezoooo.me` (four `o`s).
- **Uploads & Quota:** 4 MB hard cap (stream-abort HTTP `413`); magic-byte detection only (PDF/DOCX/TXT); reject >~5 PDF pages. Quota 10/user/day atomic in Redis + mirrored in Postgres `usage_daily` (system failures refund).
- **Security & Privacy:** Scope every DB query by `user_id` (`404`, never `403`, on non-owned rows). `DELETE /me` deletes analyses, stored files, `usage_daily`, and `neon_auth."user"` via SQL (`ON DELETE CASCADE`); FastAPI token verification must also reject tokens for deleted users. Never log resume text. Queue payloads carry analysis IDs only. Delimit resume/JD text as untrusted data in LLM prompts.
- **Boundaries:** No stock spaCy NER. Never commit/log `.env`, secrets, real Neon project/branch IDs/hosts, or real user data. Public GitHub repo: keep `AGENTS.md` < 150 lines; no new services/deps without `DECISIONS.md`; never claim anything works unless run and observed.

## Scoring Formula & Phases
`final = round(0.40 * semantic + 0.30 * entity_coverage + 0.30 * llm_fit)` (semantic provisional `0.20 -> 0`, `0.70 -> 100`, raw_cosine + weights stored per row; calibrate in Phase 3).
- **Phase 0 / 0b (Complete):** Dependencies, OpenRouter LLM, Neon Auth + GitHub check + SQL delete, Storage, Postgres `18.7`, Redis `6380` + ARQ, OCR, extractors, embeddings, public repo push + `/web` placeholder.
- **Phase 1 (Complete):** Full `/web` scaffold, `/design` tokens/clay/glass CSS, responsive `/` landing page, Neon Auth + `proxy.ts` + thin app routes, `/api` `EdDSA` JWKS skeleton, root `docker-compose.yml`, Node `26.13.1` (`fnm`), Playwright E2E + axe-core verification (interactive OAuth login callback deferred to manual check).
- **Phase 2–5:** Phase 2 (Next) backend core (`DELETE /me`, quotas, workers, OCR) -> Phase 3 LLM/scoring/`SCORING.md` -> Phase 4 full app UI -> Phase 5 hardening/launch.

## Key Pointers
- Specs: [/.design-docs/](.design-docs/project_overview.md), [srs_ieee.md](.design-docs/srs_ieee.md), [database_design.md](.design-docs/database_design.md)
- Design: [/design/rezoooo.me/](design/rezoooo.me/README.md), [App design rezoooo.me.html](design/App%20design%20rezoooo.me.html)
- Logs: [DECISIONS.md](DECISIONS.md), [HANDOFF.md](HANDOFF.md), `SCORING.md` (Phase 3)
