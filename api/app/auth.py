"""Stateless EdDSA JWT verification against Neon Auth JWKS."""

from __future__ import annotations

import asyncio
import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError
from pydantic import BaseModel

_bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    """Authenticated user identity extracted from a verified Neon Auth JWT."""

    user_id: str
    email: str | None = None
    name: str | None = None


class JwksTokenVerifier:
    """Verifies Neon Auth EdDSA JWTs using cached public keys from JWKS."""

    def __init__(self, jwks_url: str, cache_ttl_seconds: int = 300) -> None:
        self.jwks_url = jwks_url
        self._jwk_client = PyJWKClient(
            jwks_url,
            cache_jwk_set=True,
            lifespan=cache_ttl_seconds,
            timeout=10,
        )

    def verify(self, token: str) -> AuthenticatedUser:
        """Validate signature, EdDSA algorithm, expiry, and UUID subject claim.

        Note: Phase 2 adds a Postgres/Redis user-existence check so tokens for
        deleted users (DELETE /me) are rejected before the 15-min exp window ends.
        """
        try:
            header = jwt.get_unverified_header(token)
        except InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

        if header.get("alg") != "EdDSA":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unsupported token signing algorithm.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            signing_key = self._jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["EdDSA"],
                leeway=30,
                options={"verify_aud": False, "require": ["sub", "exp"]},
            )
            canonical_user_id = str(uuid.UUID(str(payload["sub"])))
        except (InvalidTokenError, PyJWKClientError, ValueError, KeyError) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

        raw_email = payload.get("email")
        raw_name = payload.get("name")
        return AuthenticatedUser(
            user_id=canonical_user_id,
            email=str(raw_email) if isinstance(raw_email, str) and raw_email else None,
            name=str(raw_name) if isinstance(raw_name, str) and raw_name else None,
        )


def _get_verifier(request: Request) -> JwksTokenVerifier:
    verifier: JwksTokenVerifier | None = getattr(request.app.state, "token_verifier", None)
    if verifier is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication JWKS verifier is not configured.",
        )
    return verifier


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    verifier: Annotated[JwksTokenVerifier, Depends(_get_verifier)],
) -> AuthenticatedUser:
    """FastAPI dependency returning the verified current user or raising HTTP 401."""
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await asyncio.to_thread(verifier.verify, credentials.credentials)


CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
