import httpx

from app.config import Settings
from app.data.cache import Cache
from app.data.universe import UNIVERSE

STATIC_SECTORS: dict[str, str] = {row["ticker"]: row["sector"] for row in UNIVERSE}
UNKNOWN_SECTOR = "Unknown"


class SectorProvider:
    def __init__(self, cache: Cache, settings: Settings) -> None:
        self._cache = cache
        self._settings = settings

    async def resolve(self, tickers: list[str]) -> dict[str, str]:
        resolved: dict[str, str] = {}
        for raw in tickers:
            ticker = raw.strip().upper()
            if not ticker or ticker in resolved:
                continue
            if ticker in STATIC_SECTORS:
                resolved[ticker] = STATIC_SECTORS[ticker]
                continue
            cached = await self._cache.get(self._key(ticker))
            if cached is not None:
                resolved[ticker] = cached
                continue
            sector = await self._fetch(ticker)
            await self._cache.set(self._key(ticker), sector, self._settings.cache_ttl_seconds)
            resolved[ticker] = sector
        return resolved

    def _key(self, ticker: str) -> str:
        return f"sector:{ticker}"

    async def _fetch(self, ticker: str) -> str:
        if not self._settings.fmp_api_key:
            return UNKNOWN_SECTOR
        url = f"{self._settings.fmp_base_url.rstrip('/')}/profile/{ticker}"
        params = {"apikey": self._settings.fmp_api_key}
        try:
            async with httpx.AsyncClient(timeout=self._settings.request_timeout_seconds) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                payload = response.json()
            if isinstance(payload, list) and payload:
                return payload[0].get("sector") or UNKNOWN_SECTOR
        except Exception:
            return UNKNOWN_SECTOR
        return UNKNOWN_SECTOR
