import asyncio
from datetime import date, timedelta

import httpx
import pytest

from app.api.deps import get_provider
from app.data.fmp import FMPProvider
from app.data.provider import DataProvider, ProviderRateLimited, ProviderUnavailable

START = date(2024, 1, 1)
END = START + timedelta(days=150)

_RATE_LIMIT_BODY = {"Error Message": "Limit Reach . Please upgrade your plan"}


def _rows(n: int = 10) -> list[dict]:
    return [{"date": f"2024-01-{day:02d}", "close": 100.0 + day} for day in range(1, n + 1)]


def _fetch(handler, tickers: list[str]):
    async def run():
        provider = FMPProvider("test-key", "https://financialmodelingprep.com/api/v3", 5.0)
        await provider._client.aclose()
        provider._client = httpx.AsyncClient(transport=httpx.MockTransport(handler), timeout=5.0)
        try:
            return await provider.get_prices(tickers, START, END)
        finally:
            await provider.close()

    return asyncio.run(run())


def test_rate_limit_raises_instead_of_looking_like_missing_data():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(429, json=_RATE_LIMIT_BODY)

    with pytest.raises(ProviderRateLimited) as error:
        _fetch(handler, ["AAPL"])
    assert "request limit" in str(error.value).lower()
    assert calls["n"] == 3


def test_bad_api_key_raises_and_does_not_retry():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(401, json={"Error Message": "Invalid API KEY"})

    with pytest.raises(ProviderUnavailable) as error:
        _fetch(handler, ["AAPL"])
    assert "api key" in str(error.value).lower()
    assert calls["n"] == 1


def test_error_message_in_a_200_body_is_surfaced():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"Error Message": "Something upstream broke"})

    with pytest.raises(ProviderUnavailable):
        _fetch(handler, ["AAPL"])


def test_unknown_ticker_is_still_missing_data_not_an_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[])

    assert _fetch(handler, ["NOSUCHTICKER"]) == {}


def test_one_rate_limited_ticker_fails_the_whole_request():
    def handler(request: httpx.Request) -> httpx.Response:
        if "AAPL" in str(request.url):
            return httpx.Response(200, json=_rows())
        return httpx.Response(429, json=_RATE_LIMIT_BODY)

    with pytest.raises(ProviderRateLimited):
        _fetch(handler, ["AAPL", "MSFT"])


def test_healthy_response_still_returns_a_series():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_rows())

    prices = _fetch(handler, ["AAPL"])
    assert list(prices) == ["AAPL"]
    assert prices["AAPL"].shape[0] == 10


def test_transport_error_is_surfaced_after_retries():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        raise httpx.ConnectError("boom")

    with pytest.raises(ProviderUnavailable) as error:
        _fetch(handler, ["AAPL"])
    assert "could not reach" in str(error.value).lower()
    assert calls["n"] == 3


class _RateLimitedProvider(DataProvider):
    name = "fmp"

    async def get_prices(self, tickers, start, end):
        raise ProviderRateLimited("The market data provider's request limit has been reached.")


@pytest.fixture()
def rate_limited(client):
    client.app.dependency_overrides[get_provider] = lambda: _RateLimitedProvider()
    yield client
    client.app.dependency_overrides.clear()


def test_validate_reports_a_rate_limit_rather_than_blaming_the_tickers(rate_limited):
    # Unknown tickers still hit the provider (known universe tickers are validated for free).
    response = rate_limited.post("/api/tickers/validate", json={"tickers": ["ZZZZ", "WXYZ"]})
    assert response.status_code == 503
    detail = response.json()["detail"]
    assert "request limit" in detail.lower()
    assert "ZZZZ" not in detail


def test_validate_known_universe_tickers_without_the_provider(rate_limited):
    # Even when the provider is rate limited, curated universe tickers validate for free.
    response = rate_limited.post("/api/tickers/validate", json={"tickers": ["AAPL", "MSFT"]})
    assert response.status_code == 200
    assert response.json()["valid"] == ["AAPL", "MSFT"]


def test_optimize_reports_a_rate_limit_as_503(rate_limited):
    response = rate_limited.post(
        "/api/optimize",
        json={"tickers": ["AAPL", "MSFT"], "objective": "max_sharpe", "risk_model": "sample"},
    )
    assert response.status_code == 503
    assert "request limit" in response.json()["detail"].lower()
