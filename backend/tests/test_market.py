from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_alpaca_client


class FakeAlpaca:
    def __init__(self, snapshots: dict[str, Any]) -> None:
        self._snapshots = snapshots
        self.asked: list[str] = []

    @property
    def configured(self) -> bool:
        return True

    async def get_snapshots(self, symbols: list[str]) -> dict[str, Any]:
        self.asked = symbols
        return self._snapshots


def snapshot(price: float, prev_close: float) -> dict[str, Any]:
    return {
        "latestTrade": {"p": price, "t": "2026-07-10T19:59:59Z"},
        "dailyBar": {"c": price, "o": prev_close},
        "prevDailyBar": {"c": prev_close},
    }


@pytest.fixture
def use(client: TestClient):
    def go(snapshots: dict[str, Any]) -> FakeAlpaca:
        fake = FakeAlpaca(snapshots)
        client.app.dependency_overrides[get_alpaca_client] = lambda: fake
        return fake

    yield go
    client.app.dependency_overrides.pop(get_alpaca_client, None)


def test_quotes_compute_daily_change(client: TestClient, use) -> None:
    use({"AAPL": snapshot(110.0, 100.0), "MSFT": snapshot(95.0, 100.0)})

    response = client.get("/api/market/quotes", params={"symbols": "aapl,msft"})
    assert response.status_code == 200, response.text
    body = response.json()

    quotes = {item["symbol"]: item for item in body["quotes"]}
    assert quotes["AAPL"]["change"] == pytest.approx(10.0)
    assert quotes["AAPL"]["change_pct"] == pytest.approx(0.10)
    assert quotes["MSFT"]["change"] == pytest.approx(-5.0)
    assert quotes["MSFT"]["change_pct"] == pytest.approx(-0.05)
    assert body["source"] and body["feed"]


def test_quotes_skip_symbols_without_usable_prices(client: TestClient, use) -> None:
    use({"AAPL": snapshot(110.0, 100.0), "ZZZZ": {}})

    body = client.get("/api/market/quotes", params={"symbols": "AAPL,ZZZZ"}).json()

    assert [item["symbol"] for item in body["quotes"]] == ["AAPL"]


def test_quotes_fall_back_to_daily_bar_when_no_trade(client: TestClient, use) -> None:
    use({"AAPL": {"dailyBar": {"c": 120.0, "o": 100.0}, "prevDailyBar": {"c": 100.0}}})

    body = client.get("/api/market/quotes", params={"symbols": "AAPL"}).json()

    assert body["quotes"][0]["price"] == pytest.approx(120.0)
    assert body["quotes"][0]["change_pct"] == pytest.approx(0.20)


def test_quotes_reject_empty_and_oversized_requests(client: TestClient, use) -> None:
    use({})

    assert client.get("/api/market/quotes", params={"symbols": " , "}).status_code == 400

    too_many = ",".join(f"T{i}" for i in range(26))
    assert client.get("/api/market/quotes", params={"symbols": too_many}).status_code == 400


def test_quotes_uppercase_and_dedupe_symbols(client: TestClient, use) -> None:
    fake = use({"AAPL": snapshot(110.0, 100.0)})

    client.get("/api/market/quotes", params={"symbols": "aapl"})

    assert fake.asked == ["AAPL"]
