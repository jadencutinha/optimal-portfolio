import json
from abc import ABC, abstractmethod
from datetime import date

import pandas as pd

from app.config import Settings
from app.data.cache import Cache


class ProviderError(Exception):
    """Upstream market-data failure, distinct from a ticker having no data."""

    status_code = 503

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ProviderRateLimited(ProviderError):
    pass


class ProviderUnavailable(ProviderError):
    pass


class DataProvider(ABC):
    name: str

    @abstractmethod
    async def get_prices(self, tickers: list[str], start: date, end: date) -> dict[str, pd.Series]: ...

    async def close(self) -> None:
        return None


def resolve_provider_name(settings: Settings) -> str:
    if settings.data_provider == "auto":
        return "fmp" if settings.fmp_api_key else "sample"
    return settings.data_provider


def build_inner_provider(settings: Settings) -> DataProvider:
    name = resolve_provider_name(settings)
    if name == "fmp":
        from app.data.fmp import FMPProvider

        return FMPProvider(settings.fmp_api_key, settings.fmp_base_url, settings.request_timeout_seconds)
    from app.data.sample import SampleProvider

    return SampleProvider(settings.trading_days)


def _series_to_json(series: pd.Series) -> str:
    return json.dumps({timestamp.strftime("%Y-%m-%d"): float(value) for timestamp, value in series.items()})


def _series_from_json(payload: str) -> pd.Series:
    data = json.loads(payload)
    index = pd.to_datetime(list(data.keys()))
    return pd.Series(list(data.values()), index=index, dtype=float).sort_index()


class CachingDataProvider(DataProvider):
    def __init__(self, inner: DataProvider, cache: Cache, ttl: int) -> None:
        self._inner = inner
        self._cache = cache
        self._ttl = ttl
        self.name = inner.name

    def _key(self, ticker: str, start: date, end: date) -> str:
        return f"prices:{self.name}:{ticker}:{start.isoformat()}:{end.isoformat()}"

    async def get_prices(self, tickers: list[str], start: date, end: date) -> dict[str, pd.Series]:
        resolved: dict[str, pd.Series] = {}
        missing: list[str] = []
        for ticker in tickers:
            cached = await self._cache.get(self._key(ticker, start, end))
            if cached is not None:
                resolved[ticker] = _series_from_json(cached)
            else:
                missing.append(ticker)
        if missing:
            fetched = await self._inner.get_prices(missing, start, end)
            for ticker, series in fetched.items():
                await self._cache.set(self._key(ticker, start, end), _series_to_json(series), self._ttl)
                resolved[ticker] = series
        return {ticker: resolved[ticker] for ticker in tickers if ticker in resolved}

    async def close(self) -> None:
        await self._inner.close()
