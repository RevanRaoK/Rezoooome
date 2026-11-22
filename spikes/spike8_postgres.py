"""Spike 8 (Phase 0b): Live Neon Postgres verification for direct DDL and pooled async queries."""

from __future__ import annotations

import asyncio
import os
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import asyncpg
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent


def strip_channel_binding(dsn: str) -> tuple[str, bool]:
    parsed = urlparse(dsn)
    q = parse_qsl(parsed.query, keep_blank_values=True)
    had_cb = any(k == "channel_binding" for k, _ in q)
    clean_q = [(k, v) for k, v in q if k != "channel_binding"]
    return urlunparse(parsed._replace(query=urlencode(clean_q))), had_cb


async def connect_with_note(dsn: str, **kwargs: object) -> tuple[asyncpg.Connection, str]:
    try:
        conn = await asyncpg.connect(dsn, timeout=15, **kwargs)
        return conn, "raw_dsn"
    except Exception as exc:
        clean_dsn, had_cb = strip_channel_binding(dsn)
        if had_cb:
            conn = await asyncpg.connect(clean_dsn, ssl="require", timeout=15, **kwargs)
            return conn, f"stripped_channel_binding (raw failed with {type(exc).__name__}: {exc})"
        raise


async def run_direct_ddl_check(direct_dsn: str) -> None:
    conn, note = await connect_with_note(direct_dsn)
    print(f"Direct connect mode: {note}")
    probe_tbl = f"_phase0b_ddl_probe_{uuid.uuid4().hex[:8]}"
    try:
        pg_ver = await conn.fetchval("SELECT version()")
        vec_row = await conn.fetchrow(
            "SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'vector'"
        )
        print(f"Postgres version: {pg_ver}")
        if vec_row:
            print(
                f"pgvector available: True (default={vec_row['default_version']}, "
                f"installed={vec_row['installed_version']})"
            )
        else:
            print("pgvector available: False")

        t0 = time.perf_counter()
        await conn.execute(
            f"CREATE TABLE {probe_tbl} (id UUID PRIMARY KEY, note TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())"
        )
        probe_id = uuid.uuid4()
        await conn.execute(f"INSERT INTO {probe_tbl} (id, note) VALUES ($1, $2)", probe_id, "phase0b-ok")
        got = await conn.fetchval(f"SELECT note FROM {probe_tbl} WHERE id = $1", probe_id)
        assert got == "phase0b-ok", f"Unexpected DDL readback: {got!r}"
        await conn.execute(f"DROP TABLE {probe_tbl}")
        ddl_ms = (time.perf_counter() - t0) * 1000
        print(f"Direct DDL cycle (CREATE/INSERT/SELECT/DROP): PASS ({ddl_ms:.1f}ms)")
    finally:
        await conn.execute(f"DROP TABLE IF EXISTS {probe_tbl}")
        await conn.close()


async def run_pooled_async_check(pooled_dsn: str) -> None:
    clean_dsn, had_cb = strip_channel_binding(pooled_dsn)
    use_dsn = clean_dsn if had_cb else pooled_dsn

    # 1. Test default statement_cache_size vs statement_cache_size=0 on PgBouncer transaction pool
    default_cache_ok = True
    default_cache_err = ""
    try:
        p_def = await asyncpg.create_pool(use_dsn, ssl="require", min_size=1, max_size=2, timeout=15)
        try:
            async def _q(i: int) -> int:
                async with p_def.acquire() as c:
                    return await c.fetchval("SELECT $1::int + 1", i)

            await asyncio.gather(*(_q(i) for i in range(6)))
        finally:
            await p_def.close()
    except Exception as exc:
        default_cache_ok = False
        default_cache_err = f"{type(exc).__name__}: {str(exc)[:180]}"

    # 2. Test recommended statement_cache_size=0 async pool
    t0 = time.perf_counter()
    pool = await asyncpg.create_pool(
        use_dsn, ssl="require", min_size=1, max_size=4, statement_cache_size=0, timeout=15
    )
    try:
        async def _run_q(i: int) -> int:
            async with pool.acquire() as c:
                return await c.fetchval("SELECT $1::int * 2", i)

        vals = await asyncio.gather(*(_run_q(i) for i in range(5)))
        assert vals == [0, 2, 4, 6, 8], f"Unexpected pool results: {vals}"
        pool_ms = (time.perf_counter() - t0) * 1000
        print(
            f"Pooled async queries (statement_cache_size=0, 5 concurrent): PASS ({pool_ms:.1f}ms) "
            f"| default_statement_cache_ok={default_cache_ok}"
            + (f" ({default_cache_err})" if default_cache_err else "")
        )
    finally:
        await pool.close()


def main() -> int:
    load_dotenv(ROOT / ".env", override=False)
    direct = os.getenv("NEON_DATABASE_URL", "").strip()
    pooled = os.getenv("NEON_DATABASE_URL_POOLED", "").strip()
    missing = [k for k, v in (("NEON_DATABASE_URL", direct), ("NEON_DATABASE_URL_POOLED", pooled)) if not v]
    if missing:
        print(f"STATUS: BLOCKED — missing .env variables: {', '.join(missing)}")
        return 2

    asyncio.run(run_direct_ddl_check(direct))
    asyncio.run(run_pooled_async_check(pooled))
    print("STATUS: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
