# HANDOFF.md — Phase 0 / 0b to Phase 1

**Date:** 2026-11-22  
**Next Session Goal:** Phase 1 — Replace the `/web` placeholder, scaffold `/api` and root `docker-compose.yml` (Redis on `127.0.0.1:6380:6379`), apply `/design` tokens, and wire Neon Auth (`@neon/auth` + FastAPI `EdDSA` JWKS + E2E GitHub OAuth verification). Do **not** build Phase 2+ ingestion/LLM pipelines yet.  
**Vercel project:** create with Root Directory = `web`, Framework = Next.js, project name `rezoooome`, no environment variables yet; production URL `https://rezoooome.vercel.app`.

---

## 1. Verified Facts (Exact Versions & Observed Phase 0 / 0b Results)

### Host, Toolchain & Placeholder Versions (Windows 11, PowerShell 5.1)
- **Python:** `3.12.10` (`py -3.12`). `uv` is **not** installed.
- **Node & `/web` Placeholder (verified `npm install` + `typecheck` + `build`):** `Node v25.8.2`, `Next.js 16.4.6` (Turbopack), `React 19.3.1`, `react-dom 19.3.1`, `TypeScript 5.9.3`, `@types/react 19.3.0`, `@types/node 26.6.6`. `pnpm` is **not** installed.
- **Docker:** `29.6.2`, Docker Compose `v5.3.1`.
- **Tesseract:** `tesseract v5.5.0.20241111` (`leptonica-1.85.0`, `eng.traineddata` & `osd.traineddata`) at `C:\Program Files\Tesseract-OCR\tesseract.exe` (**not** on `PATH`).
- **Spike Venv Key Packages (`spikes\.venv`):** `torch 2.15.0+cpu`, `sentence-transformers 6.3.0`, `openai 3.57.0`, `pydantic 2.14.4`, `fastapi 0.165.0`, `PyJWT 2.15.1`, `cryptography 50.0.2`, `httpx 0.28.1`, `asyncpg 0.32.0`, `boto3 1.44.9`, `arq 0.28.0`, `redis 5.3.1`, `pdfplumber 0.11.11`, `python-docx 1.2.0`, `pypdfium2 5.15.2`, `pytesseract 0.3.13`, `pillow 13.0.0`, `fpdf2 2.9.0`.

### Phase 0 & 0b Observed Spike Outcomes
1. **Spike 1 (`spike1_openrouter_llm.py` — OpenRouter `inclusionai/ling-3.0-flash-vl`):** **PASS (via inlined-schema `tool_calling`)**
   - **1a Endpoints/Providers:** `DeepInfra` ONLY (`slug="deepinfra"`, `tag="deepinfra/fp4"`, `quant="fp4"`), `131,072` ctx, `32,768` max_out, `$0.06/1M` input, `$0.18/1M` output, `$0.012/1M` cache read, `17` supported params (`reasoning`, `structured_outputs`, `response_format`, `tools`, `tool_choice`, etc.).
   - **1b Strict `json_schema` & `data_collection="deny"`:** Strict `json_schema` + `require_parameters=True` hit intermittent `\n`/`\t` repetition loops on DeepInfra (even at `max_tokens=4096`) and occasional `improvements=[]`. **`data_collection="deny"` (`allow_fallbacks=False`) succeeded (`HTTP 200`) on `DeepInfra`** (`29.13s` strict / `14.80s` tool_calling at `max_tokens=4096`), proving DeepInfra is **not** excluded by `"deny"`.
   - **1c 20-call benchmark:** Strict `json_schema` scored **`13/20`** (`p50=10.76s`, `p95=20.99s`; 6 `\n`/`\t` loops + 1 truncation). Naive `tools` with `$defs` failed (`HTTP 400` DeepInfra `$defs` grammar error). **Inlined-schema `tool_calling`** (`$defs` inlined, `reasoning.enabled=False`, `data_collection="deny"`, `max_tokens=4096`) achieved **`20/20` valid** (`20/20` non-empty improvements), `min=5.62s`, **`p50=10.85s`**, **`p95=18.02s`**, `max=20.39s`, avg `1707.7` in / `1469.4` out (`0` reasoning) = `3177.1` tokens, **`$0.000304/call`** (`usage.cost`). All 5 mismatch-control & injection cases returned valid JSON with `fit_score` of `0, 0, 5, 2, 0`.
   - **1d Failure/Timeout/429:** `0.05s` timeout -> `APITimeoutError`. Simulating DeepInfra outage (`ignore=["deepinfra"], allow_fallbacks=False`) -> `HTTP 404 NotFoundError` (`endpoint_count: 1`). Live `429` exhaustion was **not induced (unverified live)**.
   - **1e Fallbacks:** `qwen/qwen3.8-flash` (`Alibaba`, 1M ctx, `$0.15/$0.47` per 1M) scored `11/20` at `max_tokens=2048` with reasoning ON (9 truncations, 5/5 injection resistance `fit=0..2`), and passed 3/3 probes at `max_tokens=4096` + `reasoning.enabled=False` + `data_collection="deny"` (`HTTP 200`, `Alibaba`, `28.64s`, `$0.001013/call`; full 20-call Qwen re-run at `4096` not completed). `meta/muse-spark-1.3-contributor` (`Meta`, 1M ctx, `$0.10/$0.20`) excluded due to Meta product-improvement training terms.
2. **Spike 2 (`spike2_neon_auth.py` — Live Neon Auth & GitHub Re-check):** **PASS (email/JWT live verified; GitHub configured, E2E unverified)**
   - Live `/.well-known/jwks.json` HTTP `200` (`OKP`/`Ed25519`/`EdDSA`), `GET /ok` HTTP `200`, `POST /sign-up/email` + `GET /token` -> 15-min (`ttl_s=900`) `EdDSA` JWT verified in FastAPI `PyJWKClient` (`HTTP 200`, `emailVerified=False`), `neon_auth.user.id` = `uuid`.
   - GitHub social initiation moved from `HTTP 400 PROVIDER_NOT_SUPPORTED` -> **`HTTP 200`** -> `302` redirect to `github.com` (`has_client_id=True`, `redirect_uri` = `{NEON_AUTH_BASE_URL}/callback/github`).
   - Google social initiation -> `HTTP 200` -> `302` to `accounts.google.com` using Neon's shared proxy callback (`https://neonauth.ap-southeast-1.aws.neon.tech/.../callback/google`), confirming Neon shared development credentials.
3. **Spike 2b (`spike2b_neon_delete_user.py` — Account Deletion):** **PASS (`sql_cascade_ok=True`)**
   - `POST /delete-user` returned **`HTTP 404`** across cookie, `Bearer <session_token>`, and `Bearer <jwt>`.
   - `neon_auth.{account, session, member, invitation}` all have `ON DELETE CASCADE` on `neon_auth."user"(id)`. Transactional SQL `DELETE FROM neon_auth."user" WHERE id = $1` dropped `(user, account, session)` from `(1, 1, 1)` to `(0, 0, 0)`, invalidated `/get-session`, and caused `/sign-in/email` to return `401`. Pooled `DELETE` permission verified.
4. **Spike 3 (`spike3_neon_storage.py` — Live Neon Object Storage):** **PASS**
   - `ap-southeast-1` `head_bucket` `True` (`483.4ms`), unauthenticated HTTP `GET` returned `403` (object & bucket), `put_object` `215.4ms`, `get_object` `106.9ms` (byte-exact), `delete_object` `145.6ms`, `head_object` `404`.
5. **Spike 8 (`spike8_postgres.py` — Live Neon Postgres):** **PASS**
   - `PostgreSQL 18.7`, `pgvector 0.8.7` available (`installed=None`), direct DDL `CREATE/INSERT/SELECT/DROP` (`489.5ms`), pooled 5-concurrent async queries (`1052.8ms`, `statement_cache_size=0`).
6. **Spike 4 (`spike4_arq_redis.py` — Redis Port `6380` & ARQ):** **PASS**
   - Native Windows `arq.exe` on `127.0.0.1:6380:6379` (`redis:7-alpine` `7.4.9`): `0.44s` pickup, `0.00s` run. Idle `ZRANGEBYSCORE`: `118/min` (`0.5s`), `12/min` (`5.0s`), `4/min` (`15.0s`, `345.6k/mo` for 2 workers = `69.1%` of Upstash 500k free tier).
7. **Spikes 5–7 (Local OCR, Extractors, Embeddings):** **PASS**
   - Tesseract `v5.5.0.20241111` (`200 DPI`: `2.36s/page`, `99.7%` recall; `300 DPI`: `3.56s/page`, `99.7%` recall). `pdfplumber` `139.8ms` (2 pages); `python-docx` `32.2ms` (paragraphs + tables). `all-MiniLM-L6-v2` CPU: `1.10s` warm load, `34.4ms` resume, `29.5ms` JD, `raw_cosine=0.7757`.

---

## 2. Unverified / Unconfirmed Items
- **GitHub interactive sign-in end-to-end:** Configured and server-side initiation verified (`HTTP 200 -> 302 github.com`), **not yet verified end to end** (Phase 1 task). Multi-callback routing across two separate Neon branches on one GitHub OAuth App is also untested E2E.
- **Neon shared Google credentials details:** Exact numeric rate limits / user caps are unpublished (`unconfirmed`), and whether Neon hard-blocks shared Google credentials on production domains at runtime is `unconfirmed` (production launch still requires your own client per Neon docs).
- **Neon Console UI menu label & localhost Domains rule:** `setup-oauth.md` says **Settings → Auth** while `production-checklist.md` says **Settings → Better Auth** (exact current UI wording unconfirmed in live browser); unconfirmed whether manually adding `http://localhost:3000` in Domains works once **Allow Localhost** is disabled, and unconfirmed whether any custom domain/CNAME option exists for `NEON_AUTH_BASE_URL` itself.
- **OpenRouter 429 & full Qwen 20-call `4096` run:** Live HTTP `429` rate-limit triggering was not induced (`unverified live`); full 20-call Qwen re-run at `max_tokens=4096, reasoning=False` remains `unverified` (3/3 long/deny probes passed).
- **App commands in `AGENTS.md`:** `/web` `npm run dev` / `lint` / Playwright, `/api` (`uvicorn`, `pytest`, `ruff`, `.workers.*`), and root `docker compose up -d redis` remain **`(unverified)`** until Phase 1+.

---

## 3. Auth Tasks & Phase Notes

### Enable and Verify GitHub Sign-in (Phase 1 Task)
- **Current status:** GitHub OAuth credentials are configured in Neon Console for `https://rezoooome.vercel.app`, and `POST /sign-in/social` now redirects (`302`) to `github.com` (`not yet verified end to end`).
- **Phase 1 verification steps (and setup steps if adding another Neon branch later):**
  1. In **Neon Console**, open your project -> select the target branch -> go to **Settings → Auth** (or **Settings → Better Auth**, exact menu wording unconfirmed) -> **OAuth providers** -> **GitHub**.
  2. Copy the branch callback URL shown in Neon Console: `{NEON_AUTH_BASE_URL}/callback/github` (stored in Neon Console per branch, NOT in `.env`).
  3. Confirm `https://rezoooome.vercel.app` is added under **Console → Auth → Configuration → Domains** (no trailing slash).
  4. In `/web` Phase 1 (`@neon/auth`), sign in via GitHub end to end on `http://localhost:3000` (with **Allow Localhost** enabled) and after deployment on `https://rezoooome.vercel.app`; confirm `neon_auth.user`, `neon_auth.account`, and FastAPI JWKS `/me` succeed.
- **One GitHub OAuth App vs two (`localhost` + prod):** Official GitHub OAuth Apps docs confirm **up to 10 Authorization callback URLs** are supported per OAuth app (via **Add callback URL**), AND Neon Auth's callback URL is `{NEON_AUTH_BASE_URL}/callback/github` (the Neon branch auth host, not the app domain). Therefore, while local dev (`http://localhost:3000`) and production (`https://rezoooome.vercel.app`) share the **same Neon branch**, one GitHub OAuth App works for both and needs no client ID/secret in `.env`. If you create a **separate Neon dev branch** later (`DEV_NEON_AUTH_BASE_URL`), add its `{DEV_NEON_AUTH_BASE_URL}/callback/github` as a 2nd callback URL on the same GitHub app (untested across branches) or register a 2nd GitHub OAuth app and enter its Client ID/Secret on that Neon dev branch in Neon Console.

### Google Sign-in: Shared Dev Credentials & Switching to Your Own Client (Pre-Launch)
- **Confirmed:** Google currently uses Neon's shared development credentials (`Shared credentials` badge in Neon Console; confirmed in `setup-oauth.md` & live `redirect_uri` pointing to Neon's shared regional proxy).
- **What this means for production:** The consent screen shows **Neon's name and logo** instead of `rezoooo.me`, you lack control over branding/scopes/credentials, limits on the shared app are **unconfirmed** (unpublished in Neon docs), and Neon's Production Checklist requires configuring your own Google OAuth client before launch.
- **Steps to switch to your own Google OAuth client:**
  1. Open [Google Cloud Console](https://console.cloud.google.com/) -> **Google Auth Platform / OAuth consent screen** (`console.cloud.google.com/auth/branding`): set App name `rezoooo.me`, support & developer emails, add Authorized domains (your app domain and Neon auth domain if prompted), **publish** out of *Testing* mode (and pass Google verification if required — otherwise external users are blocked).
  2. Create OAuth client (**Web application**):
     - **Authorized redirect URI:** `{NEON_AUTH_BASE_URL}/callback/google` (copy exact value from Neon Console for each branch you use).
     - **Authorized JavaScript origins:** `https://rezoooome.vercel.app`, `http://localhost:3000` (for dev), and `{NEON_AUTH_BASE_URL}` origin if required by Google.
  3. Copy Client ID + Client Secret into **Neon Console → project → branch → Settings → Auth → OAuth providers → Google → Configure → Update** (CLI: `neon neon-auth oauth-provider add --provider-id google ...`).

### Phase 2 Notes — Account Deletion (`DELETE /me`)
- `POST /delete-user` returned `HTTP 404`, whereas transactional SQL delete passed cleanly in Spike 2b.
- **`DELETE /me` contract:**
  1. Delete the user's stored resume files from Object Storage (`Storage.delete`) / `LocalDiskStorage`.
  2. Delete the user's Postgres `analyses` and `usage_daily` rows (`WHERE user_id = $1`).
  3. Execute transactional SQL `DELETE FROM neon_auth."user" WHERE id = $1` (verified `ON DELETE CASCADE` removes `neon_auth.account`, `session`, `member`, and `invitation`).
  4. **FastAPI token check requirement:** Because stateless `EdDSA` JWTs stay cryptographically valid until `exp` (`15 min`), FastAPI's auth dependency **must also verify the user still exists** (e.g., query `neon_auth."user"` or maintain a Redis revocation tombstone TTL >= 15 min on deletion) and return `401` once deleted.

---

## 4. Recommended LLM Configuration (Phase 3)
- **Primary Model:** `inclusionai/ling-3.0-flash-vl` via OpenRouter (`DeepInfra`).
- **Structured-Output Mode:** **`tool_calling` with `$defs`/`$ref` inlined** (`strict: true` grammar via inlined JSON Schema — do NOT pass Pydantic `$defs` to DeepInfra tools, and do NOT use `json_schema` mode on Ling due to `\n`/`\t` repetition loops), validated by Pydantic v2 (`min_length=1` on `improvements` & `strengths`) + **1 repair retry**.
- **Parameters & Privacy:** `max_tokens=4096`, `temperature=0`, `extra_body={"provider": {"require_parameters": True, "data_collection": "deny"}, "reasoning": {"enabled": False}}`.
- **Timeout & Latency:** `45s` timeout on primary (`60s` on fallback). Observed typical Ling latency: **`p50=10.85s`**, **`p95=18.02s`** (`max=20.39s`), **`20/20` valid**, **`$0.000304/call`**.
- **Single-Provider Risk & Fallback:** DeepInfra is Ling's sole OpenRouter provider (outage returns `HTTP 404` when ignored). Cap worker LLM concurrency, respect `Retry-After` on `429` (`RateLimitError`), retry transient `429`/`5xx`/timeouts (3 attempts, exponential backoff + jitter), and fall back to **`qwen/qwen3.8-flash`** (`strict json_schema`, `reasoning.enabled=False`, `max_tokens=4096`, `data_collection="deny"`) when DeepInfra fails. Do **not** use `meta/muse-spark-1.3-contributor`.

---

## 5. Deployment Domains & "When the Domain Changes" Checklist
- **Rules:** Prod URL for now `https://rezoooome.vercel.app`; local dev `http://localhost:3000`; `rezoooo.me` wordmark/product name only; read all origins from env vars (never hard-code domains in code).
- **Neon Auth Trusted Origins:** Set in **Console → Auth → Configuration → Domains** (`https://...`, no trailing slash; wildcards like `https://*.rezoooome.vercel.app` supported for previews). `http://localhost:3000` is allowed alongside prod by default via **Allow Localhost**; disable **Allow Localhost** on the prod branch before public launch.

### When the Domain Changes Checklist
1. **Vercel domain setup:** Vercel Project → **Settings → Domains** -> add custom domain + configure DNS at registrar (e.g., GoDaddy). Note the `.vercel.app` alias keeps working unless disabled.
2. **GitHub OAuth app:** Update **Homepage URL** to the new domain; **Authorization callback URL remains `{NEON_AUTH_BASE_URL}/callback/github`** unless you switch Neon branches.
3. **Google OAuth client (if created):** Update **Authorized JavaScript origins** and **OAuth consent screen Authorized domains** (and re-verify if Google requires it); **Authorized redirect URI remains `{NEON_AUTH_BASE_URL}/callback/google`** unless you switch Neon branches.
4. **Neon Auth trusted origins:** In **Console → Auth → Configuration → Domains**, add the new exact `https://...` origin (no trailing slash; add `www.` too if served); keep or remove `.vercel.app`; ensure **Allow Localhost** is off on the prod branch.
5. **FastAPI CORS allowed web origin(s):** Update the backend `CORS_ORIGINS` env var on the API host to include the new exact origin(s).
6. **Base-URL env vars on Vercel & API host:** Update any `NEXT_PUBLIC_APP_URL` / `APP_URL` / callback-base env vars defined in Phase 1 across Vercel and the FastAPI host (`exact var names TBD in Phase 1`).
7. **`NEON_AUTH_BASE_URL`:** Tied to the **Neon database branch**, NOT the frontend domain — **no change needed** on a Vercel custom domain change unless switching Neon branches (any custom-domain/CNAME feature for the Neon Auth host itself could not be confirmed).

---

## 6. Windows Notes for Phase 1+
- **PowerShell 5.1:** Use `;` (never `&&`), check `$LASTEXITCODE`.
- **Redis port `6380`:** Another local Redis container holds `6379`. Standardize root `docker-compose.yml` on `127.0.0.1:6380:6379` and `.env` `REDIS_URL=redis://127.0.0.1:6380/0`. For Upstash prod free tier (`500k cmds/mo`), set `poll_delay=15.0s` (`~345.6k/mo` for 2 workers) or upgrade to PAYG for sub-2s pickup.
- **Tesseract:** Read `TESSERACT_CMD` env var (`C:\Program Files\Tesseract-OCR\tesseract.exe`), default **200 DPI**.
- **CPU PyTorch:** Install `torch` from `https://download.pytorch.org/whl/cpu` in `api\.venv` before `requirements.txt`.
- **`/design` specs:** [tokens.json](design/rezoooo.me/tokens.json), [tokens.css](design/rezoooo.me/tokens.css), `design/rezoooo.me/assets/Logos/`, [App design rezoooo.me.html](design/App%20design%20rezoooo.me.html), [design/rezoooo.me/README.md](design/rezoooo.me/README.md).
- **Phase 3 calibration:** `raw_cosine=0.7757` already exceeds provisional `0.70 -> 100` upper clip; calibrate empirically (`SCORING.md`).

---

## 7. Itemized Changes Made to `/.design-docs/`
1. **[.design-docs/project_overview.md](.design-docs/project_overview.md):** Switched LLM references from `OpenCode` -> `OpenRouter` (`inclusionai/ling-3.0-flash-vl`, inlined-schema `tool_calling`, `data_collection: "deny"`, DeepInfra single-provider risk + `qwen/qwen3.8-flash` fallback); updated local Redis to port `6380` + Upstash polling budget; updated Storage (`ap-southeast-1` live S3 verified), Neon Postgres `18.7` + `pgvector 0.8.7`, Auth (live JWKS, GitHub configured / not yet E2E, Google shared dev creds, `DELETE /me` SQL + FastAPI deleted-user JWT rejection), and `Open items`.
2. **[.design-docs/srs_ieee.md](.design-docs/srs_ieee.md):** Replaced all `OpenCode` occurrences (Sections 2.1, 2.5, 2.6) with `OpenRouter` (`inclusionai/ling-3.0-flash-vl`); recorded local Redis port `6380` and Tesseract `200 DPI` in Section 2.4; updated Section 2.6 Assumptions & Dependencies with all live Phase 0b LLM, Auth/`DELETE /me`, Storage, Postgres `18.7`, and Upstash findings.
3. **[.design-docs/database_design.md](.design-docs/database_design.md):** Updated `Users` with live-verified `PostgreSQL 18.7`, `pgvector 0.8.7`, `neon_auth.user.id` `UUID`, and `ON DELETE CASCADE` constraints across `neon_auth`; added `CREATE INDEX analyses_created_at`; updated `Retention and deletion` with transactional SQL `DELETE FROM neon_auth."user" WHERE id = $1` + FastAPI deleted-user token rejection.
