import asyncio
import logging
from datetime import date

import httpx
import pandas as pd

from app.data.provider import DataProvider, ProviderError, ProviderRateLimited, ProviderUnavailable

logger = logging.getLogger("optimal_portfolio.fmp")

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
        logger.info("FMP fetch %s %s..%s", ticker, start.isoformat(), end.isoformat())
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
                    raise ProviderUnavailable(
                        "Could not reach the market data provider. Check your connection and try again."
                    ) from error
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
                logger.warning(
                    "FMP symbol %s is not available on the current plan (HTTP 402); skipping it.", ticker
                )
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
            if isinstance(payload, dict) and payload.get("Error Message"):
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
