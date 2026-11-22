"""Spike 7: Benchmark local sentence-transformers all-MiniLM-L6-v2 on CPU."""

from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

SAMPLES = Path(__file__).resolve().parent / "samples"
RESUME_TXT = SAMPLES / "sample_resume.txt"
JD_TXT = SAMPLES / "sample_jd.txt"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def main() -> int:
    resume = RESUME_TXT.read_text(encoding="utf-8")
    jd = JD_TXT.read_text(encoding="utf-8")

    t0 = time.perf_counter()
    model = SentenceTransformer(MODEL_NAME, device="cpu")
    first_load_s = time.perf_counter() - t0

    # Second load from local HuggingFace cache to measure warm startup load time
    t1 = time.perf_counter()
    model = SentenceTransformer(MODEL_NAME, device="cpu")
    warm_load_s = time.perf_counter() - t1

    # Cold first encode
    t2 = time.perf_counter()
    emb_res = model.encode(resume, normalize_embeddings=True)
    cold_res_ms = (time.perf_counter() - t2) * 1000

    # Steady-state CPU encoding timing (5 iterations)
    res_times: list[float] = []
    jd_times: list[float] = []
    for _ in range(5):
        ta = time.perf_counter()
        emb_res = model.encode(resume, normalize_embeddings=True)
        res_times.append((time.perf_counter() - ta) * 1000)

        tb = time.perf_counter()
        emb_jd = model.encode(jd, normalize_embeddings=True)
        jd_times.append((time.perf_counter() - tb) * 1000)

    raw_cosine = float(np.dot(emb_res, emb_jd))
    print(
        f"Model={MODEL_NAME} dim={len(emb_res)} | first_load={first_load_s:.2f}s "
        f"warm_cache_load={warm_load_s:.2f}s"
    )
    print(
        f"CPU encode: cold_resume={cold_res_ms:.1f}ms, avg_resume={sum(res_times)/len(res_times):.1f}ms, "
        f"avg_jd={sum(jd_times)/len(jd_times):.1f}ms, raw_cosine={raw_cosine:.4f}"
    )
    print("STATUS: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
