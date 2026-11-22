"""FastAPI application entrypoint and Phase 1 health/auth routes."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.auth import CurrentUserDep, JwksTokenVerifier
from app.config import Settings, get_settings


class HealthResponse(BaseModel):
    """Liveness response schema."""

    status: str
    version: str


class MeResponse(BaseModel):
    """Authenticated user identity summary returned by GET /me."""

    user_id: str
    email: str | None = None
    name: str | None = None


def create_app(settings: Settings | None = None) -> FastAPI:
    """Construct and configure the FastAPI application instance."""
    resolved = settings or get_settings()
    app = FastAPI(title="rezoooo.me API", version="0.1.0")
    app.state.settings = resolved
    app.state.token_verifier = (
        JwksTokenVerifier(
            jwks_url=resolved.effective_jwks_url,
            cache_ttl_seconds=resolved.jwks_cache_ttl_seconds,
        )
        if resolved.effective_jwks_url
        else None
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/health", response_model=HealthResponse, tags=["system"])
    async def health() -> HealthResponse:
        return HealthResponse(status="ok", version="0.1.0")

    @app.get("/me", response_model=MeResponse, tags=["auth"])
    async def me(user: CurrentUserDep) -> MeResponse:
        return MeResponse(user_id=user.user_id, email=user.email, name=user.name)

    return app


app = create_app()
