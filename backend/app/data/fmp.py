import asyncio
from datetime import date

import httpx
import pandas as pd

from app.data.provider import DataProvider


class FMPProvider(DataProvider):
    name = "fmp"

    def __init__(self, api_key: str | None, base_url: str, timeout: float) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
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
        url = f"{self._base_url}/historical-price-full/{ticker}"
        params = {"from": start.isoformat(), "to": end.isoformat(), "apikey": self._api_key}
        response = await self._client.get(url, params=params)
        response.raise_for_status()
        payload = response.json()
        historical = payload.get("historical", [])
        records = {row["date"]: row["close"] for row in historical if row.get("close") is not None}
        if not records:
            return None
        index = pd.to_datetime(list(records.keys()))
        return pd.Series(list(records.values()), index=index, dtype=float).sort_index()

    async def close(self) -> None:
        await self._client.aclose()
