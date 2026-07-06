import asyncio
from datetime import date

import httpx
import pandas as pd

from app.data.provider import DataProvider

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
            if isinstance(result, Exception) or result is None:
                continue
            if not result.empty:
                prices[ticker] = result
        return prices

    async def _fetch_one(self, ticker: str, start: date, end: date) -> pd.Series | None:
        url = f"{self._base_url}/historical-price-eod/full"
        params = {
            "symbol": ticker,
            "from": start.isoformat(),
            "to": end.isoformat(),
            "apikey": self._api_key,
        }
        for attempt in range(3):
            try:
                response = await self._client.get(url, params=params)
            except (httpx.TimeoutException, httpx.TransportError):
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            if response.status_code == 429:
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            response.raise_for_status()
            payload = response.json()
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
