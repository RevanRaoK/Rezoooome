"""Minimal ARQ worker settings for Phase 0/0b Spike 4 (port 6380)."""

from __future__ import annotations

import os
from arq.connections import RedisSettings


async def echo_analysis(ctx: dict, analysis_id: str) -> dict[str, str]:
    return {"status": "ok", "analysis_id": analysis_id, "worker_pid": str(os.getpid())}


class WorkerSettings:
    functions = [echo_analysis]
    redis_settings = RedisSettings.from_dsn(os.getenv("REDIS_URL", "redis://127.0.0.1:6380/0"))
    poll_delay = float(os.getenv("ARQ_POLL_DELAY", "0.5"))
    queue_name = os.getenv("ARQ_QUEUE_NAME", "arq:queue")
