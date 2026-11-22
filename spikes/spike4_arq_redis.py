"""Spike 4 (Phase 0b): Test ARQ worker on native Windows against Docker Redis on port 6380 (supports --quick)."""

from __future__ import annotations

import argparse
import asyncio
import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import redis
from arq import create_pool
from arq.connections import RedisSettings
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
TARGET_REDIS_PORT = 6380
SPIKE_REDIS_URL = f"redis://127.0.0.1:{TARGET_REDIS_PORT}/0"
UPSTASH_FREE_MONTHLY_LIMIT = 500_000


def _arq_exe() -> str:
    candidate = ROOT / "spikes" / ".venv" / "Scripts" / "arq.exe"
    return str(candidate) if candidate.exists() else "arq"


def resolve_redis_url() -> str:
    load_dotenv(ROOT / ".env", override=False)
    env_url = os.getenv("REDIS_URL", "").strip()
    if env_url:
        port = urlparse(env_url).port
        if port != TARGET_REDIS_PORT:
            print(
                f"WARNING: .env REDIS_URL uses port {port} (expected {TARGET_REDIS_PORT} because 6379 is held by another local Redis container). "
                f"Using localhost port {TARGET_REDIS_PORT} for spike isolation; update REDIS_URL in .env to port {TARGET_REDIS_PORT}."
            )
            return SPIKE_REDIS_URL
        print(f".env REDIS_URL port verified: {port}")
        return env_url
    return SPIKE_REDIS_URL


def start_worker_subprocess(redis_url: str, poll_delay: float, queue_name: str = "arq:queue") -> subprocess.Popen[str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT) + os.pathsep + env.get("PYTHONPATH", "")
    env["REDIS_URL"] = redis_url
    env["ARQ_POLL_DELAY"] = str(poll_delay)
    env["ARQ_QUEUE_NAME"] = queue_name
    return subprocess.Popen(
        [_arq_exe(), "spikes.spike4_worker.WorkerSettings"],
        cwd=str(ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def stop_worker_subprocess(proc: subprocess.Popen[str]) -> tuple[int | None, str]:
    if proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
    out = proc.stdout.read() if proc.stdout else ""
    return proc.returncode, out


async def enqueue_and_verify(redis_url: str) -> dict[str, str]:
    pool = await create_pool(RedisSettings.from_dsn(redis_url))
    try:
        job = await pool.enqueue_job("echo_analysis", "spike4-analysis-002")
        assert job is not None
        return await job.result(timeout=15)
    finally:
        await pool.aclose()


def measure_idle_commands(
    r: redis.Redis, redis_url: str, poll_delay: float, duration_s: int
) -> tuple[int, int, float, dict[str, int]]:
    proc = start_worker_subprocess(redis_url, poll_delay=poll_delay)
    try:
        time.sleep(2.5)
        if proc.poll() is not None:
            rc, out = stop_worker_subprocess(proc)
            raise RuntimeError(f"ARQ worker exited prematurely ({rc}):\n{out}")

        r.config_resetstat()
        start_cmds = int(r.info("stats")["total_commands_processed"])
        time.sleep(duration_s)
        end_cmds = int(r.info("stats")["total_commands_processed"])
        cmdstats = {k.removeprefix("cmdstat_"): int(v["calls"]) for k, v in r.info("commandstats").items()}

        raw_delta = end_cmds - start_cmds
        worker_cmds = sum(v for k, v in cmdstats.items() if k.split("|", 1)[0] not in ("info", "config"))
        cmds_per_min = worker_cmds * (60.0 / duration_s)
        return worker_cmds, raw_delta, cmds_per_min, cmdstats
    finally:
        stop_worker_subprocess(proc)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quick", action="store_true", help="Skip 120s idle command benchmark.")
    args = parser.parse_args()

    redis_url = resolve_redis_url()
    r = redis.Redis.from_url(redis_url, decode_responses=True)
    pong = r.ping()
    port = urlparse(redis_url).port
    print(f"Redis PING (port {port}): {pong}")

    proc = start_worker_subprocess(redis_url, poll_delay=0.5)
    try:
        time.sleep(2.5)
        if proc.poll() is not None:
            rc, out = stop_worker_subprocess(proc)
            print(f"Native Windows ARQ startup FAILED (rc={rc}):\n{out}")
            return 1
        result = asyncio.run(enqueue_and_verify(redis_url))
        print(f"Native Windows ARQ job result (port {port}): {result}")
    finally:
        rc, worker_log = stop_worker_subprocess(proc)
    print(f"Native Windows ARQ worker log (terminate rc={rc}):\n{worker_log.strip()}")

    if not args.quick:
        r.flushdb()
        cmds_60, raw_60, cpm_05, stats_05 = measure_idle_commands(r, redis_url, poll_delay=0.5, duration_s=60)
        print(
            f"Idle poll_delay=0.5s (60s): worker_cmds={cmds_60} (raw_delta={raw_60}), rate={cpm_05:.1f}/min, "
            f"2_workers_month={cpm_05*43200*2:,.0f}, commandstats={stats_05}"
        )
        for pd in (5.0, 15.0):
            cmds_s, raw_s, cpm, stats = measure_idle_commands(r, redis_url, poll_delay=pd, duration_s=30)
            m2 = cpm * 43200 * 2
            print(
                f"Idle poll_delay={pd:.1f}s (30s): worker_cmds={cmds_s} (raw_delta={raw_s}), rate={cpm:.1f}/min, "
                f"2_workers_month={m2:,.0f} ({m2/UPSTASH_FREE_MONTHLY_LIMIT*100:.1f}% of Upstash free tier), commandstats={stats}"
            )

    print("STATUS: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
