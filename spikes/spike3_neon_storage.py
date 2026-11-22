"""Spike 3 (Phase 0b): Live Neon Object Storage verification (bucket exists, privacy refusal, upload/download/delete)."""

from __future__ import annotations

import os
import sys
import time
import uuid
from pathlib import Path

import boto3
import httpx
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    load_dotenv(ROOT / ".env", override=False)
    bucket = os.getenv("S3_BUCKET", "").strip() or os.getenv("NEON_STORAGE_BUCKET", "").strip()
    required = ("AWS_ENDPOINT_URL_S3", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION")
    missing = [k for k in required if not os.getenv(k, "").strip()]
    if not bucket:
        missing.append("S3_BUCKET")
    if missing:
        print(f"STATUS: BLOCKED — missing .env variables: {', '.join(missing)}")
        return 2

    endpoint = os.environ["AWS_ENDPOINT_URL_S3"].strip().rstrip("/")
    region = os.environ["AWS_REGION"].strip()
    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"].strip(),
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"].strip(),
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )

    t_hb = time.perf_counter()
    client.head_bucket(Bucket=bucket)
    hb_ms = (time.perf_counter() - t_hb) * 1000
    print(f"Bucket exists (head_bucket): True | region={region} | elapsed={hb_ms:.1f}ms")

    key = f"spikes/phase0b-probe-{uuid.uuid4().hex}.txt"
    payload = b"rezoooo.me phase0b private object storage verification\n"
    deleted_confirmed = False

    try:
        t0 = time.perf_counter()
        client.put_object(Bucket=bucket, Key=key, Body=payload, ContentType="text/plain")
        t_up = (time.perf_counter() - t0) * 1000

        # Unauthenticated HTTP checks (must be refused with 401 or 403)
        r_unauth_obj = httpx.get(f"{endpoint}/{bucket}/{key}", timeout=10.0)
        r_unauth_bkt = httpx.get(f"{endpoint}/{bucket}", timeout=10.0)
        print(
            f"Unauthenticated refusal: object_http={r_unauth_obj.status_code}, "
            f"bucket_http={r_unauth_bkt.status_code}"
        )
        assert r_unauth_obj.status_code in (401, 403), f"Expected 401/403 on object, got {r_unauth_obj.status_code}"
        assert r_unauth_bkt.status_code in (401, 403), f"Expected 401/403 on bucket, got {r_unauth_bkt.status_code}"

        t1 = time.perf_counter()
        got = client.get_object(Bucket=bucket, Key=key)["Body"].read()
        t_down = (time.perf_counter() - t1) * 1000
        assert got == payload, "Downloaded bytes did not match uploaded payload"
    finally:
        t2 = time.perf_counter()
        client.delete_object(Bucket=bucket, Key=key)
        t_del = (time.perf_counter() - t2) * 1000
        try:
            client.head_object(Bucket=bucket, Key=key)
        except ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            deleted_confirmed = code in ("404", "NoSuchKey", "NotFound")

    print(
        f"STATUS: PASS — upload={t_up:.1f}ms download={t_down:.1f}ms "
        f"delete={t_del:.1f}ms deleted_404={deleted_confirmed} private_refused=True"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
