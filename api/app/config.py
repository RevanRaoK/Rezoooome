"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed runtime settings for the rezoooo.me API."""

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    neon_auth_base_url: str = ""
    neon_auth_jwks_url: str = ""
    cors_allowed_origins: str = "http://localhost:3000"
    jwks_cache_ttl_seconds: int = 300

    @property
    def effective_jwks_url(self) -> str:
        """Return explicit JWKS URL or derive it from NEON_AUTH_BASE_URL."""
        explicit = self.neon_auth_jwks_url.strip()
        if explicit:
            return explicit
        base = self.neon_auth_base_url.strip().rstrip("/")
        if base:
            return f"{base}/.well-known/jwks.json"
        return ""

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated CORS origins with normalized trailing slashes."""
        origins: list[str] = []
        for raw in self.cors_allowed_origins.split(","):
            cleaned = raw.strip().rstrip("/")
            if cleaned:
                origins.append(cleaned)
        return origins


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
