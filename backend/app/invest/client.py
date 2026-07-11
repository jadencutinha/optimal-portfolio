from __future__ import annotations

import httpx

from app.config import Settings


class InvestError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AlpacaClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._base = settings.alpaca_base_url.rstrip("/")
        self._data = settings.alpaca_data_url.rstrip("/")
        self._timeout = settings.alpaca_timeout_seconds

    @property
    def configured(self) -> bool:
        return bool(self._settings.alpaca_api_key and self._settings.alpaca_secret_key)

    def _headers(self) -> dict[str, str]:
        return {
            "APCA-API-KEY-ID": self._settings.alpaca_api_key or "",
            "APCA-API-SECRET-KEY": self._settings.alpaca_secret_key or "",
        }

    async def _request(self, method: str, path: str, **kwargs) -> dict | list | None:
        if not self.configured:
            raise InvestError(
                "Investing is not configured. Set ALPACA_API_KEY and ALPACA_SECRET_KEY to enable it.",
                503,
            )
        url = f"{self._base}{path}"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.request(method, url, headers=self._headers(), **kwargs)
        except httpx.HTTPError as error:
            raise InvestError("Could not reach the brokerage. Try again in a moment.", 502) from error

        if response.status_code >= 400:
            raise InvestError(self._error_message(response), self._client_status(response.status_code))
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    @staticmethod
    def _client_status(upstream: int) -> int:
        if upstream in (401, 403):
            return 502
        if upstream == 422:
            return 400
        return 502

    @staticmethod
    def _error_message(response: httpx.Response) -> str:
        try:
            body = response.json()
        except ValueError:
            return "The brokerage rejected the request."
        if isinstance(body, dict) and body.get("message"):
            return str(body["message"])
        return "The brokerage rejected the request."

    async def get_account(self) -> dict:
        return await self._request("GET", "/v2/account")  # type: ignore[return-value]

    async def get_positions(self) -> list:
        return await self._request("GET", "/v2/positions") or []  # type: ignore[return-value]

    async def get_orders(self, limit: int = 25) -> list:
        params = {"status": "all", "limit": limit, "direction": "desc", "nested": "false"}
        return await self._request("GET", "/v2/orders", params=params) or []  # type: ignore[return-value]

    async def submit_notional_order(self, symbol: str, notional: float, side: str = "buy") -> dict:
        body = {
            "symbol": symbol,
            "notional": round(notional, 2),
            "side": side,
            "type": "market",
            "time_in_force": "day",
        }
        return await self._request("POST", "/v2/orders", json=body)  # type: ignore[return-value]

    async def close_all_positions(self) -> list:
        params = {"cancel_orders": "true"}
        return await self._request("DELETE", "/v2/positions", params=params) or []  # type: ignore[return-value]

    async def close_position(self, symbol: str, percentage: float | None = None) -> dict | None:
        params: dict[str, str] = {}
        if percentage is not None:
            params["percentage"] = f"{max(min(percentage, 100.0), 0.0):.2f}"
        return await self._request(  # type: ignore[return-value]
            "DELETE", f"/v2/positions/{symbol.upper()}", params=params or None
        )

    async def cancel_all_orders(self) -> list:
        return await self._request("DELETE", "/v2/orders") or []  # type: ignore[return-value]

    async def cancel_order(self, order_id: str) -> None:
        await self._request("DELETE", f"/v2/orders/{order_id}")

    async def get_portfolio_history(
        self,
        *,
        period: str | None = None,
        timeframe: str = "1D",
        date_start: str | None = None,
        extended_hours: bool = False,
    ) -> dict:
        params: dict[str, str] = {"timeframe": timeframe}
        if period:
            params["period"] = period
        if date_start:
            params["date_start"] = date_start
        if extended_hours:
            params["extended_hours"] = "true"
        return await self._request(  # type: ignore[return-value]
            "GET", "/v2/account/portfolio/history", params=params
        )
