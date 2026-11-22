"""Unit tests for Phase 1 EdDSA JWKS verification and FastAPI auth routes."""

from __future__ import annotations

import base64
import json
import threading
import time
import uuid
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, HTTPServer

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


@pytest.fixture
def jwks_env() -> Iterator[tuple[TestClient, ed25519.Ed25519PrivateKey, str]]:
    """Run an ephemeral local JWKS server with an Ed25519 public key."""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_raw = private_key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    kid = "phase1-test-ed25519"
    jwks_body = json.dumps(
        {
            "keys": [
                {
                    "kty": "OKP",
                    "crv": "Ed25519",
                    "alg": "EdDSA",
                    "use": "sig",
                    "kid": kid,
                    "x": _b64url(public_raw),
                }
            ]
        }
    ).encode("utf-8")

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            if self.path == "/.well-known/jwks.json":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(jwks_body)
                return
            self.send_response(404)
            self.end_headers()

        def log_message(self, format: str, *args: object) -> None:
            return

    server = HTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    settings = Settings(
        _env_file=None,
        neon_auth_jwks_url=f"http://127.0.0.1:{port}/.well-known/jwks.json",
        cors_allowed_origins="http://localhost:3000",
    )
    client = TestClient(create_app(settings))
    try:
        yield client, private_key, kid
    finally:
        server.shutdown()
        server.server_close()


def test_health_ok(jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str]) -> None:
    client, _, _ = jwks_env
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "version": "0.1.0"}


def test_me_valid_eddsa_token_returns_200(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, private_key, kid = jwks_env
    uid = str(uuid.uuid4())
    now = int(time.time())
    token = jwt.encode(
        {"sub": uid, "email": "synthetic-user@example.com", "name": "Test User", "iat": now, "exp": now + 900},
        private_key,
        algorithm="EdDSA",
        headers={"kid": kid},
    )
    res = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() == {"user_id": uid, "email": "synthetic-user@example.com", "name": "Test User"}


def test_me_missing_token_returns_401(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, _, _ = jwks_env
    res = client.get("/me")
    assert res.status_code == 401


def test_me_minor_iat_clock_skew_allowed(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, private_key, kid = jwks_env
    uid = str(uuid.uuid4())
    now = int(time.time())
    token = jwt.encode(
        {"sub": uid, "iat": now + 5, "exp": now + 900},
        private_key,
        algorithm="EdDSA",
        headers={"kid": kid},
    )
    res = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["user_id"] == uid


def test_me_expired_token_returns_401(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, private_key, kid = jwks_env
    uid = str(uuid.uuid4())
    now = int(time.time())
    token = jwt.encode(
        {"sub": uid, "iat": now - 1800, "exp": now - 60},
        private_key,
        algorithm="EdDSA",
        headers={"kid": kid},
    )
    res = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_me_tampered_token_returns_401(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, private_key, kid = jwks_env
    uid = str(uuid.uuid4())
    now = int(time.time())
    token = jwt.encode(
        {"sub": uid, "iat": now, "exp": now + 900},
        private_key,
        algorithm="EdDSA",
        headers={"kid": kid},
    )
    parts = token.split(".")
    flipped = ("A" if parts[2][0] != "A" else "B") + parts[2][1:]
    tampered = f"{parts[0]}.{parts[1]}.{flipped}"
    res = client.get("/me", headers={"Authorization": f"Bearer {tampered}"})
    assert res.status_code == 401


def test_me_wrong_key_returns_401(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, _, kid = jwks_env
    uid = str(uuid.uuid4())
    now = int(time.time())
    wrong_key = ed25519.Ed25519PrivateKey.generate()
    token = jwt.encode(
        {"sub": uid, "iat": now, "exp": now + 900},
        wrong_key,
        algorithm="EdDSA",
        headers={"kid": kid},
    )
    res = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_me_wrong_algorithm_returns_401(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, _, kid = jwks_env
    uid = str(uuid.uuid4())
    now = int(time.time())
    hs_token = jwt.encode(
        {"sub": uid, "iat": now, "exp": now + 900},
        "not-an-eddsa-signing-secret-00000",
        algorithm="HS256",
        headers={"kid": kid},
    )
    res = client.get("/me", headers={"Authorization": f"Bearer {hs_token}"})
    assert res.status_code == 401


def test_cors_allows_configured_origin_and_blocks_others(
    jwks_env: tuple[TestClient, ed25519.Ed25519PrivateKey, str],
) -> None:
    client, _, _ = jwks_env
    allowed = client.options(
        "/me",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert allowed.status_code == 200
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"

    blocked = client.options(
        "/me",
        headers={
            "Origin": "https://untrusted.example.com",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert blocked.headers.get("access-control-allow-origin") is None
