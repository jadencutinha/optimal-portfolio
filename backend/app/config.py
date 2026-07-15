import json
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Optimal Portfolio API"
    environment: str = "development"
    api_prefix: str = "/api"

    data_provider: Literal["auto", "fmp", "sample"] = "auto"
    fmp_api_key: str | None = None
    fmp_base_url: str = "https://financialmodelingprep.com/stable"
    request_timeout_seconds: float = 15.0

    redis_url: str | None = None
    cache_ttl_seconds: int = 21600

    database_url: str = "sqlite+aiosqlite:///./optimal_portfolio.db"

    supabase_url: str = ""
    supabase_jwt_secret: str | None = None
    supabase_service_role_key: str | None = None

    assistant_provider: Literal["auto", "anthropic", "openai"] = "auto"

    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-6"
    anthropic_base_url: str = "https://api.anthropic.com/v1"
    anthropic_version: str = "2023-06-01"
    anthropic_max_tokens: int = 1200
    anthropic_timeout_seconds: float = 60.0

    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    openai_base_url: str = "https://api.openai.com/v1"
    openai_timeout_seconds: float = 60.0

    alpaca_api_key: str | None = None
    alpaca_secret_key: str | None = None
    alpaca_base_url: str = "https://paper-api.alpaca.markets"
    alpaca_data_url: str = "https://data.alpaca.markets"
    alpaca_timeout_seconds: float = 30.0

    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.0

    rate_limit_enabled: bool = True
    rate_limit_storage_uri: str = "memory://"
    rate_limit_default: str = "200/minute"
    rate_limit_heavy: str = "30/minute"
    rate_limit_ai: str = "10/minute"
    rate_limit_data: str = "60/minute"

    risk_free_rate: float = 0.02
    trading_days: int = 252
    default_lookback_days: int = 756
    min_observations: int = 60

    backtest_history_days: int = 1260
    backtest_estimation_window: int = 252

    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        text = value.strip()
        if not text:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        if text.startswith("["):
            return json.loads(text)
        return [origin.strip() for origin in text.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
