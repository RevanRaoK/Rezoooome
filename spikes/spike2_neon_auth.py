"""Spike 2 (Phase 0b): Live Neon Auth verification (JWKS discovery, providers, real test user JWT, neon_auth schema) + local FastAPI EdDSA check."""

from __future__ import annotations

import asyncio
import base64
import json
import os
import secrets
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, parse_qsl, urlencode, urlparse, urlunparse

import asyncpg
import httpx
import jwt
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.testclient import TestClient
from jwt import PyJWKClient

ROOT = Path(__file__).resolve().parent.parent


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def make_fastapi_auth_app(jwks_url: str) -> FastAPI:
    jwk_client = PyJWKClient(jwks_url)
    bearer = HTTPBearer(auto_error=True)
    app = FastAPI()

    def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict[str, object]:
        try:
            signing_key = jwk_client.get_signing_key_from_jwt(creds.credentials)
            payload = jwt.decode(
                creds.credentials,
                signing_key.key,
                algorithms=["EdDSA"],
                options={"verify_aud": False},
            )
            return {
                "user_id": str(uuid.UUID(str(payload["sub"]))),
                "claim_keys": sorted(payload.keys()),
            }
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    @app.get("/me")
    def me(info: dict[str, object] = Depends(current_user)) -> dict[str, object]:
        return info

    return app


def run_local_eddsa_fastapi_test() -> bool:
    priv = ed25519.Ed25519PrivateKey.generate()
    pub_raw = priv.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    kid = "spike-ed25519-1"
    jwks_payload = json.dumps(
        {"keys": [{"kty": "OKP", "crv": "Ed25519", "alg": "EdDSA", "use": "sig", "kid": kid, "x": _b64url(pub_raw)}]}
    ).encode("utf-8")

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            if self.path == "/.well-known/jwks.json":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(jwks_payload)
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, format: str, *args: object) -> None:
            return

    server = HTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        client = TestClient(make_fastapi_auth_app(f"http://127.0.0.1:{port}/.well-known/jwks.json"))
        uid = str(uuid.uuid4())
        now = int(time.time())
        valid_tok = jwt.encode({"sub": uid, "iat": now, "exp": now + 900}, priv, algorithm="EdDSA", headers={"kid": kid})
        exp_tok = jwt.encode({"sub": uid, "iat": now - 1200, "exp": now - 60}, priv, algorithm="EdDSA", headers={"kid": kid})
        bad_tok = jwt.encode({"sub": uid, "iat": now, "exp": now + 900}, ed25519.Ed25519PrivateKey.generate(), algorithm="EdDSA", headers={"kid": kid})

        r_ok = client.get("/me", headers={"Authorization": f"Bearer {valid_tok}"})
        r_exp = client.get("/me", headers={"Authorization": f"Bearer {exp_tok}"})
        r_bad = client.get("/me", headers={"Authorization": f"Bearer {bad_tok}"})
        r_none = client.get("/me")
        ok = (
            r_ok.status_code == 200
            and r_ok.json().get("user_id") == uid
            and r_exp.status_code == 401
            and r_bad.status_code == 401
            and r_none.status_code in (401, 403)
        )
        print(f"Local EdDSA TestClient: ok={ok} (valid={r_ok.status_code}, exp={r_exp.status_code}, bad={r_bad.status_code}, none={r_none.status_code})")
        return ok
    finally:
        server.shutdown()
        server.server_close()


def run_live_neon_auth_checks(auth_base: str, env_jwks_url: str, dsn: str = "") -> dict[str, object]:
    base = auth_base.rstrip("/")
    results: dict[str, object] = {}
    headers = {"Origin": "http://localhost:3000"}

    # 1. Discover JWKS from NEON_AUTH_BASE_URL
    discovered_jwks_url = ""
    for suffix in ("/.well-known/jwks.json", "/jwks", "/api/auth/jwks"):
        r = httpx.get(f"{base}{suffix}", timeout=10.0)
        if r.status_code == 200:
            try:
                body = r.json()
            except Exception:
                body = {}
            keys = body.get("keys", [])
            if keys:
                discovered_jwks_url = f"{base}{suffix}"
                key_meta = [(k.get("kty"), k.get("crv"), k.get("alg"), k.get("kid"), k.get("use")) for k in keys]
                print(f"Live JWKS discovery ({suffix}): HTTP 200 | keys={key_meta}")
                results["jwks_suffix"] = suffix
                results["jwks_keys"] = key_meta
                break
            else:
                print(f"Live JWKS probe ({suffix}): HTTP 200 but keys={keys}")
        else:
            print(f"Live JWKS probe ({suffix}): HTTP {r.status_code}")

    if env_jwks_url and discovered_jwks_url:
        print(f"NEON_AUTH_JWKS_URL matches {results.get('jwks_suffix')}: {env_jwks_url.rstrip('/') == discovered_jwks_url.rstrip('/')}")

    # 2. Check /ok and /open-api/generate-schema
    r_ok = httpx.get(f"{base}/ok", headers=headers, timeout=10.0)
    print(f"Live GET /ok: HTTP {r_ok.status_code} body={r_ok.text[:120]}")

    r_oa = httpx.get(f"{base}/open-api/generate-schema", headers=headers, timeout=10.0)
    if r_oa.status_code == 200:
        paths = sorted(r_oa.json().get("paths", {}).keys())
        interesting = [p for p in paths if any(k in p for k in ("sign", "token", "session", "jwks", "delete", "link", "account"))]
        print(f"Live OpenAPI paths ({len(paths)} total), key auth paths: {interesting[:25]}")
    else:
        print(f"Live GET /open-api/generate-schema: HTTP {r_oa.status_code}")

    # 3. Probe OAuth providers (Google, GitHub) without completing login
    for prov in ("google", "github"):
        r_soc = httpx.post(
            f"{base}/sign-in/social",
            headers={**headers, "Content-Type": "application/json"},
            json={"provider": prov, "callbackURL": "http://localhost:3000/dashboard"},
            timeout=10.0,
        )
        host = None
        err_code = None
        has_client_id = None
        redirect_uri_shape = None
        try:
            data = r_soc.json()
            if data.get("url"):
                parsed_url = urlparse(str(data["url"]))
                raw_host = parsed_url.netloc
                host = "<neon-auth-branch-host>" if ".neonauth." in raw_host else raw_host
                qs = parse_qs(parsed_url.query)
                has_client_id = bool(qs.get("client_id"))
                raw_redir = (qs.get("redirect_uri") or [""])[0]
                if raw_redir:
                    r_parsed = urlparse(raw_redir)
                    r_host = "<neon-auth-branch-host>" if ".neonauth." in r_parsed.netloc else r_parsed.netloc
                    idx = r_parsed.path.find("/callback/")
                    r_suffix = r_parsed.path[idx:] if idx != -1 else r_parsed.path
                    redirect_uri_shape = f"{r_parsed.scheme}://{r_host}/...{r_suffix}"
            if data.get("code") or data.get("message"):
                err_code = f"{data.get('code')}: {data.get('message')}"
        except Exception:
            pass
        print(
            f"Social provider '{prov}': HTTP {r_soc.status_code} | redirect_host={host} "
            f"| has_client_id={has_client_id} | redirect_uri_shape={redirect_uri_shape} | err={err_code}"
        )

    # 4. Create synthetic disposable user -> obtain JWT -> verify against live JWKS -> delete user
    test_email = f"phase0b-{uuid.uuid4().hex[:10]}@example.com"
    test_pw = f"P0b!{secrets.token_urlsafe(12)}9a"
    results["real_jwt_verified"] = False

    with httpx.Client(headers=headers, timeout=15.0, follow_redirects=False) as hc:
        r_su = hc.post(
            f"{base}/sign-up/email",
            json={"email": test_email, "password": test_pw, "name": "Phase0b Probe"},
        )
        su_keys = sorted(r_su.json().keys()) if r_su.headers.get("content-type", "").startswith("application/json") else []
        print(f"Email sign-up (/sign-up/email): HTTP {r_su.status_code} | body_keys={su_keys} | cookies={len(hc.cookies)}")

        raw_jwt = r_su.headers.get("set-auth-jwt", "").strip()
        if not raw_jwt:
            r_tok = hc.get(f"{base}/token")
            print(f"GET /token: HTTP {r_tok.status_code}")
            if r_tok.status_code == 200:
                raw_jwt = str(r_tok.json().get("token", "")).strip()
        if not raw_jwt:
            r_sess = hc.get(f"{base}/get-session")
            print(f"GET /get-session: HTTP {r_sess.status_code}")
            raw_jwt = r_sess.headers.get("set-auth-jwt", "").strip()
            if not raw_jwt and r_sess.status_code == 200 and isinstance(r_sess.json(), dict):
                sess_obj = r_sess.json().get("session") or {}
                if isinstance(sess_obj, dict) and str(sess_obj.get("token", "")).count(".") == 2:
                    raw_jwt = str(sess_obj["token"]).strip()

        if raw_jwt and discovered_jwks_url:
            hdr = jwt.get_unverified_header(raw_jwt)
            unverified_claims = jwt.decode(raw_jwt, options={"verify_signature": False})
            ttl = None
            if "exp" in unverified_claims and "iat" in unverified_claims:
                ttl = int(unverified_claims["exp"]) - int(unverified_claims["iat"])

            # Verify via live PyJWKClient + FastAPI TestClient
            fastapi_client = TestClient(make_fastapi_auth_app(discovered_jwks_url))
            r_api = fastapi_client.get("/me", headers={"Authorization": f"Bearer {raw_jwt}"})
            results["real_jwt_verified"] = r_api.status_code == 200
            print(
                f"Live JWT verification via FastAPI+JWKS: ok={results['real_jwt_verified']} (HTTP {r_api.status_code}) "
                f"| hdr={{alg={hdr.get('alg')}, kid={hdr.get('kid')}, typ={hdr.get('typ')}}} "
                f"| claim_keys={sorted(unverified_claims.keys())} | ttl_s={ttl} "
                f"| emailVerified={unverified_claims.get('emailVerified')}"
            )
        else:
            print(f"Live JWT verification skipped: raw_jwt_present={bool(raw_jwt)}, jwks_present={bool(discovered_jwks_url)}")

        # Cleanup test user
        r_del = hc.post(f"{base}/delete-user", json={"password": test_pw})
        if r_del.status_code >= 400:
            r_del = hc.post(f"{base}/delete-user", json={})
        print(f"Test user cleanup (/delete-user): HTTP {r_del.status_code}")
        results["cleanup_http"] = r_del.status_code
        if r_del.status_code >= 400 and dsn:
            cleanup_status = asyncio.run(delete_test_user_sql(dsn, test_email))
            print(f"Test user cleanup (SQL fallback): {cleanup_status}")
            results["cleanup_sql"] = cleanup_status

    return results


def _clean_asyncpg_dsn(dsn: str) -> str:
    parsed = urlparse(dsn)
    params = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k != "channel_binding"]
    return urlunparse(parsed._replace(query=urlencode(params)))


async def delete_test_user_sql(dsn: str, email: str) -> str:
    conn = await asyncpg.connect(_clean_asyncpg_dsn(dsn), ssl="require", timeout=15)
    try:
        return await conn.execute('DELETE FROM neon_auth."user" WHERE email = $1', email)
    finally:
        await conn.close()


async def inspect_neon_auth_schema(dsn: str) -> None:
    conn = await asyncpg.connect(_clean_asyncpg_dsn(dsn), ssl="require", timeout=15)
    try:
        rows = await conn.fetch(
            """
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'neon_auth' AND table_name IN ('user', 'account', 'session')
            ORDER BY table_name, ordinal_position
            """
        )
        by_table: dict[str, list[str]] = {}
        for r in rows:
            by_table.setdefault(r["table_name"], []).append(f"{r['column_name']}:{r['data_type']}")
        print(f"Live neon_auth tables: { {t: len(cols) for t, cols in by_table.items()} }")
        for t, cols in by_table.items():
            print(f"  neon_auth.{t}: {cols}")
    finally:
        await conn.close()


def main() -> int:
    load_dotenv(ROOT / ".env", override=False)
    local_ok = run_local_eddsa_fastapi_test()

    auth_base = os.getenv("NEON_AUTH_BASE_URL", "").strip()
    env_jwks = os.getenv("NEON_AUTH_JWKS_URL", "").strip()
    dsn = os.getenv("NEON_DATABASE_URL", "").strip()

    if not auth_base:
        print("STATUS: BLOCKED — NEON_AUTH_BASE_URL missing in .env")
        return 2

    live_res = run_live_neon_auth_checks(auth_base, env_jwks, dsn)
    if dsn:
        asyncio.run(inspect_neon_auth_schema(dsn))

    passed = local_ok and bool(live_res.get("jwks_keys")) and bool(live_res.get("real_jwt_verified"))
    print(f"STATUS: {'PASS' if passed else 'PARTIAL'}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
