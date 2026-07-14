import asyncio
from datetime import date

import httpx
import pandas as pd

from app.data.provider import (
    DataProvider,
    ProviderError,
    ProviderRateLimited,
    ProviderUnavailable,
)

_LEGACY_SUFFIX = "/api/v3"
_STABLE_BASE = "https://financialmodelingprep.com/stable"


def _stable_base(base_url: str) -> str:
    """Normalize a configured base URL to FMP's current 'stable' API.

    The legacy /api/v3 endpoints were retired on 2025-08-31, so an old
    base URL is rewritten to the stable base rather than failing with 403.
    """
    base = base_url.rstrip("/")
    if base.endswith(_LEGACY_SUFFIX):
        return base[: -len(_LEGACY_SUFFIX)] + "/stable"
    return base or _STABLE_BASE


class FMPProvider(DataProvider):
    name = "fmp"

    def __init__(self, api_key: str | None, base_url: str, timeout: float) -> None:
        self._api_key = api_key
        self._base_url = _stable_base(base_url)
        self._client = httpx.AsyncClient(timeout=timeout)

    async def get_prices(self, tickers: list[str], start: date, end: date) -> dict[str, pd.Series]:
        tasks = [self._fetch_one(ticker, start, end) for ticker in tickers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        prices: dict[str, pd.Series] = {}
        for ticker, result in zip(tickers, results, strict=True):
            if isinstance(result, ProviderError):
                raise result
            if isinstance(result, Exception) or result is None:
                continue
            if not result.empty:
                prices[ticker] = result
        return prices

    async def _fetch_one(self, ticker: str, start: date, end: date) -> pd.Series | None:
        ticker = ticker.strip().upper()
        
        series = await self._fetch_symbol(ticker, start, end)

        if series is not None:
            return series

        # If direct lookup fails, resolve the ticker
        # This is mainly needed for assets where FMP uses a different symbol.
        # BTC -> BTCUSD
        resolved_symbol = await self._resolve_symbol(ticker)

        if resolved_symbol:
            return await self._fetch_symbol(resolved_symbol,start,end)
        return None

    async def _resolve_symbol(self, query: str) -> str | None:
        url = f"{self._base_url}/search-symbol"
        params = {
            "query": query,
            "apikey": self._api_key,
        }

        try:
            response = await self._client.get(url, params=params)
            response.raise_for_status()
        except httpx.HTTPError as error:
            return None
        results = response.json()
        
        if not isinstance(results, list) or not results:
            return None
        
        for item in results:
            if item.get("exchange") == "CRYPTO":
                return item.get("symbol")
            
        for item in results:
            if item.get("symbol", "").upper() == query:
                return item.get("symbol")
        return None

    async def _fetch_symbol(self, ticker: str, start: date, end: date) -> pd.Series | None:
        url = f"{self._base_url}/historical-price-eod/full"
        params = {
            "symbol": ticker,
            "from": start.isoformat(),
            "to": end.isoformat(),
            "apikey": self._api_key,
        }
        attempts = 3
        for attempt in range(attempts):
            try:
                response = await self._client.get(url, params=params)
            except (httpx.TimeoutException, httpx.TransportError) as error:
                if attempt == attempts - 1:
                    raise ProviderUnavailable("Could not reach the market data provider. Check your connection and try again.") from error
                await asyncio.sleep(0.5 * (attempt + 1))
                continue

            if response.status_code == 429:
                if attempt == attempts - 1:
                    raise ProviderRateLimited(
                        "The market data provider's request limit has been reached. "
                        "It resets daily, or you can set DATA_PROVIDER=sample to keep working with synthetic data."
                    )
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
        
            if response.status_code == 402:
                return None

            if response.status_code in (401, 403):
                raise ProviderUnavailable(
                    "The market data provider rejected the API key. Check FMP_API_KEY in your environment."
                )

            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as error:
                raise ProviderUnavailable(
                    f"The market data provider returned an error (HTTP {response.status_code})."
                ) from error

            payload = response.json()

            if (isinstance(payload, dict) and payload.get("Error Message")):
                raise ProviderUnavailable(f"Market data provider error: {payload['Error Message']}")

            rows = payload if isinstance(payload, list) else payload.get("historical", [])
            records = {
                row["date"]: row["close"]
                for row in rows
                if isinstance(row, dict) and row.get("date") and row.get("close") is not None
            }
            if not records:
                return None
            index = pd.to_datetime(list(records.keys()))
            return pd.Series(list(records.values()), index=index, dtype=float).sort_index()
        return None

    async def close(self) -> None:
        await self._client.aclose()