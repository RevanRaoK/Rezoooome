"""Spike 2b (Phase 0b): Investigate & test Neon Auth user account deletion (REST /delete-user vs transactional SQL cascade)."""

from __future__ import annotations

import asyncio
import os
import secrets
import sys
import uuid
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import asyncpg
import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent


def _clean_dsn(dsn: str) -> str:
    parsed = urlparse(dsn)
    q = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k != "channel_binding"]
    return urlunparse(parsed._replace(query=urlencode(q)))


def inspect_neon_docs() -> None:
    for url in (
        "https://neon.com/docs/auth/guides/manage-auth-api.md",
        "https://neon.com/docs/auth/roadmap.md",
    ):
        r = httpx.get(url, timeout=15.0, follow_redirects=True)
        txt = r.text
        hits = [
            line.strip()
            for line in txt.splitlines()
            if any(k in line.lower() for k in ("delete", "remove", "user")) and ("http" in line.lower() or "/" in line or "neon-auth" in line.lower())
        ]
        print(f"Docs {url.split('/')[-1]} (HTTP {r.status_code}): {len(hits)} matching lines")
        for h in hits[:12]:
            print(f"  {h[:160]}")


async def _counts_for_user(conn: asyncpg.Connection, user_id: uuid.UUID) -> tuple[int, int, int]:
    u = await conn.fetchval('SELECT count(*) FROM neon_auth."user" WHERE id = $1', user_id)
    a = await conn.fetchval('SELECT count(*) FROM neon_auth.account WHERE "userId" = $1', user_id)
    s = await conn.fetchval('SELECT count(*) FROM neon_auth.session WHERE "userId" = $1', user_id)
    return int(u), int(a), int(s)


async def test_sql_delete_and_verify(direct_dsn: str, pooled_dsn: str, user_id_str: str) -> bool:
    uid = uuid.UUID(user_id_str)
    conn = await asyncpg.connect(_clean_dsn(direct_dsn), ssl="require", timeout=15)
    try:
        before = await _counts_for_user(conn, uid)
        print(f"DB counts BEFORE SQL delete (user, account, session): {before}")
        async with conn.transaction():
            res = await conn.execute('DELETE FROM neon_auth."user" WHERE id = $1', uid)
        after = await _counts_for_user(conn, uid)
        print(f"Direct SQL DELETE result={res} | DB counts AFTER (user, account, session): {after}")
    finally:
        await conn.close()

    # Also test that pooled DSN can query/delete inside neon_auth (no-op check on already deleted user)
    pconn = await asyncpg.connect(_clean_dsn(pooled_dsn), ssl="require", statement_cache_size=0, timeout=15)
    try:
        p_after = await _counts_for_user(pconn, uid)
        p_del = await pconn.execute('DELETE FROM neon_auth."user" WHERE id = $1', uid)
        print(f"Pooled verify counts={p_after}, pooled DELETE permissions check={p_del}")
    finally:
        await pconn.close()

    return after == (0, 0, 0)


async def cleanup_synthetic(direct_dsn: str, email: str) -> None:
    conn = await asyncpg.connect(_clean_dsn(direct_dsn), ssl="require", timeout=15)
    try:
        await conn.execute('DELETE FROM neon_auth."user" WHERE email = $1', email)
    finally:
        await conn.close()


def main() -> int:
    load_dotenv(ROOT / ".env", override=False)
    auth_base = os.getenv("NEON_AUTH_BASE_URL", "").strip().rstrip("/")
    direct_dsn = os.getenv("NEON_DATABASE_URL", "").strip()
    pooled_dsn = os.getenv("NEON_DATABASE_URL_POOLED", "").strip()
    if not auth_base or not direct_dsn or not pooled_dsn:
        print("STATUS: BLOCKED — missing NEON_AUTH_BASE_URL / NEON_DATABASE_URL / NEON_DATABASE_URL_POOLED")
        return 2

    inspect_neon_docs()

    headers = {"Origin": "http://localhost:3000"}
    r_oa = httpx.get(f"{auth_base}/open-api/generate-schema", headers=headers, timeout=15.0)
    if r_oa.status_code == 200:
        paths = r_oa.json().get("paths", {})
        del_paths = {p: list(v.keys()) for p, v in paths.items() if any(k in p.lower() for k in ("delete", "remove", "admin"))}
        print(f"OpenAPI delete/remove/admin paths: {del_paths}")

    email = f"phase0b-del-{uuid.uuid4().hex[:10]}@example.com"
    pw = f"DelTest!{secrets.token_urlsafe(12)}9a"
    endpoint_succeeded = False
    sql_succeeded = False

    try:
        with httpx.Client(headers=headers, timeout=15.0, follow_redirects=False) as hc:
            r_su = hc.post(f"{auth_base}/sign-up/email", json={"email": email, "password": pw, "name": "Del Probe"})
            if r_su.status_code != 200:
                print(f"Sign-up failed: HTTP {r_su.status_code} {r_su.text[:200]}")
                return 1
            su_body = r_su.json()
            user_id = str((su_body.get("user") or {}).get("id", ""))
            sess_tok = str(su_body.get("token") or "")
            jwt_tok = r_su.headers.get("set-auth-jwt", "").strip()
            if not jwt_tok:
                rt = hc.get(f"{auth_base}/token")
                if rt.status_code == 200:
                    jwt_tok = str(rt.json().get("token", "")).strip()
            print(f"Created disposable user (id_is_uuid={bool(uuid.UUID(user_id))}, sess_tok_len={len(sess_tok)}, jwt_len={len(jwt_tok)})")

            # Attempt POST /delete-user across 3 auth styles
            attempts = [
                ("cookie_only", {}),
                ("bearer_session_token", {"Authorization": f"Bearer {sess_tok}"} if sess_tok else {}),
                ("bearer_jwt", {"Authorization": f"Bearer {jwt_tok}"} if jwt_tok else {}),
            ]
            for label, extra_hdr in attempts:
                if label != "cookie_only" and not extra_hdr:
                    continue
                r_del = hc.post(f"{auth_base}/delete-user", headers=extra_hdr, json={"password": pw})
                print(f"POST /delete-user ({label}): HTTP {r_del.status_code} body={r_del.text[:200]}")
                if 200 <= r_del.status_code < 300:
                    endpoint_succeeded = True
                    break

            if not endpoint_succeeded:
                sql_succeeded = asyncio.run(test_sql_delete_and_verify(direct_dsn, pooled_dsn, user_id))

            # Verify session & sign-in are invalidated after deletion
            r_gs = hc.get(f"{auth_base}/get-session")
            r_si = hc.post(f"{auth_base}/sign-in/email", json={"email": email, "password": pw})
            print(
                f"Post-delete auth check: get-session HTTP {r_gs.status_code} body={r_gs.text[:120]} "
                f"| sign-in HTTP {r_si.status_code} body={r_si.text[:160]}"
            )
    finally:
        asyncio.run(cleanup_synthetic(direct_dsn, email))

    ok = endpoint_succeeded or sql_succeeded
    print(f"STATUS: {'PASS' if ok else 'FAIL'} (endpoint_ok={endpoint_succeeded}, sql_cascade_ok={sql_succeeded})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
