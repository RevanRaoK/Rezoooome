# rezoooo.me API (`/api`)

Phase 1 FastAPI skeleton with health check and stateless Neon Auth `EdDSA` JWKS JWT verification.

## Setup (Windows PowerShell)

```powershell
Set-Location api
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Run Locally

Configured via root `.env` (or environment variables): `NEON_AUTH_BASE_URL` / `NEON_AUTH_JWKS_URL` and `CORS_ALLOWED_ORIGINS`.

```powershell
Set-Location api
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Test & Lint

```powershell
Set-Location api
.\.venv\Scripts\pytest.exe -v
.\.venv\Scripts\ruff.exe check .
```
