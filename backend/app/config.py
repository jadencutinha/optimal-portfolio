from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Optimal Portfolio API"
    environment: str = "development"
    api_prefix: str = "/api"

    data_provider: Literal["auto", "fmp", "sample"] = "auto"
    fmp_api_key: str | None = None
    fmp_base_url: str = "https://financialmodelingprep.com/api/v3"
    request_timeout_seconds: float = 15.0

    redis_url: str | None = None
    cache_ttl_seconds: int = 21600

    database_url: str = "sqlite+aiosqlite:///./optimal_portfolio.db"

    supabase_url: str = ""
    supabase_jwt_secret: str | None = None
    supabase_service_role_key: str | None = None

    risk_free_rate: float = 0.02
    trading_days: int = 252
    default_lookback_days: int = 756
    min_observations: int = 60

    backtest_history_days: int = 1260
    backtest_estimation_window: int = 252

    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
