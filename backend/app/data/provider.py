import json
from abc import ABC, abstractmethod
from datetime import date, timedelta
from typing import TYPE_CHECKING

import pandas as pd

from app.config import Settings
from app.data.cache import Cache

if TYPE_CHECKING:
    from app.data.repository import PriceRepository


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

    async def get_quotes(self, symbols: list[str]) -> dict[str, float]:
        """Latest intraday price per symbol, best effort.

        Used to mark live paper-trading positions so profit and loss move with the
        market instead of being frozen at the last cached close. Returns whatever it
        can and stays empty when the provider has no real-time feed, so callers must
        fall back to the most recent close for any symbol left out.
        """
        return {}

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


class PersistentPriceProvider(DataProvider):
    """A durable read-through cache backed by the price_bars table.

    On any miss it fetches one deep (canonical) window from the upstream API and stores
    it, then serves every consumer's window by slicing that stored history. This means
    the market-data API is hit at most about once per ticker every few days, no matter
    how many different date ranges the app asks for (validate, optimize, backtest, game,
    invest all reuse the same stored bars) or how often a cold cache is restarted.
    """

    FRESHNESS_DAYS = 4
    CANONICAL_DAYS = 365 * 8
    MIN_OBSERVATIONS = 5

    def __init__(self, inner: DataProvider, repository: "PriceRepository") -> None:
        self._inner = inner
        self._repository = repository
        self.name = inner.name

    def _is_fresh(self, series: pd.Series | None, end: date) -> bool:
        if series is None or series.empty or len(series) < self.MIN_OBSERVATIONS:
            return False
        latest = series.index.max().date()
        return (end - latest).days <= self.FRESHNESS_DAYS

    @staticmethod
    def _slice(series: pd.Series, start: date, end: date) -> pd.Series:
        window = series[(series.index >= pd.Timestamp(start)) & (series.index <= pd.Timestamp(end))]
        return window if not window.empty else series

    async def get_prices(self, tickers: list[str], start: date, end: date) -> dict[str, pd.Series]:
        canonical_start = min(start, end - timedelta(days=self.CANONICAL_DAYS))
        stored = await self._repository.load_prices(self.name, tickers, canonical_start, end)
        resolved: dict[str, pd.Series] = {}
        missing: list[str] = []
        for ticker in tickers:
            series = stored.get(ticker)
            if self._is_fresh(series, end):
                resolved[ticker] = self._slice(series, start, end)
            else:
                missing.append(ticker)
        if missing:
            fetched = await self._inner.get_prices(missing, canonical_start, end)
            if fetched:
                await self._repository.store_prices(self.name, pd.DataFrame(fetched))
            for ticker, series in fetched.items():
                resolved[ticker] = self._slice(series, start, end)
        return {ticker: resolved[ticker] for ticker in tickers if ticker in resolved}

    async def get_quotes(self, symbols: list[str]) -> dict[str, float]:
        return await self._inner.get_quotes(symbols)

    async def close(self) -> None:
        await self._inner.close()


class CachingDataProvider(DataProvider):
    # Quotes are cached only briefly so live positions still move, while a burst of
    # invest requests (account, positions, orders all poll together) shares one fetch.
    QUOTE_TTL_SECONDS = 15

    def __init__(self, inner: DataProvider, cache: Cache, ttl: int) -> None:
        self._inner = inner
        self._cache = cache
        self._ttl = ttl
        self._quote_ttl = min(ttl, self.QUOTE_TTL_SECONDS)
        self.name = inner.name

    def _key(self, ticker: str, start: date, end: date) -> str:
        return f"prices:{self.name}:{ticker}:{start.isoformat()}:{end.isoformat()}"

    def _quote_key(self, symbol: str) -> str:
        return f"quote:{self.name}:{symbol}"

    async def get_quotes(self, symbols: list[str]) -> dict[str, float]:
        wanted = sorted({symbol.upper() for symbol in symbols if symbol})
        resolved: dict[str, float] = {}
        missing: list[str] = []
        for symbol in wanted:
            cached = await self._cache.get(self._quote_key(symbol))
            if cached is not None:
                try:
                    resolved[symbol] = float(cached)
                    continue
                except ValueError:
                    pass
            missing.append(symbol)
        if missing:
            fetched = await self._inner.get_quotes(missing)
            for symbol, price in fetched.items():
                await self._cache.set(self._quote_key(symbol), repr(float(price)), self._quote_ttl)
                resolved[symbol] = float(price)
        return resolved

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
