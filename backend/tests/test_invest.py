from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_alpaca_client, get_current_user
from app.auth.repository import ProfileData

PORTFOLIO = {
    "name": "Target 40/60",
    "objective": "max_sharpe",
    "risk_model": "sample",
    "tickers": ["AAPL", "MSFT"],
    "weights": {"AAPL": 0.4, "MSFT": 0.6},
    "metrics": {"sharpe_ratio": 0.8, "expected_return": 0.12, "volatility": 0.15},
}


class FakeAlpaca:
    def __init__(self, positions: list[dict[str, Any]]) -> None:
        self._positions = positions
        self.orders: list[tuple[str, float, str]] = []
        self.closed: list[str] = []

    @property
    def configured(self) -> bool:
        return True

    async def get_positions(self) -> list[dict[str, Any]]:
        return self._positions

    async def submit_notional_order(self, symbol: str, notional: float, side: str = "buy") -> dict[str, Any]:
        self.orders.append((symbol, notional, side))
        return {"id": f"order-{symbol}-{side}", "status": "accepted"}

    async def close_position(self, symbol: str, percentage: float | None = None) -> dict[str, Any]:
        self.closed.append(symbol)
        return {"id": f"close-{symbol}", "status": "accepted"}


def position(symbol: str, market_value: float) -> dict[str, Any]:
    return {"symbol": symbol, "market_value": market_value}


@pytest.fixture
def setup(client: TestClient):
    created: dict[str, Any] = {}

    def go(uid: str, plan: str, positions: list[dict[str, Any]]) -> tuple[FakeAlpaca, int]:
        client.app.dependency_overrides[get_current_user] = lambda: ProfileData(
            id=uid, email=f"{uid}@example.com", plan=plan, plan_selected=True
        )
        fake = FakeAlpaca(positions)
        client.app.dependency_overrides[get_alpaca_client] = lambda: fake
        response = client.post("/api/portfolios", json=PORTFOLIO)
        assert response.status_code == 200, response.text
        created["id"] = response.json()["id"]
        return fake, created["id"]

    yield go

    client.app.dependency_overrides.pop(get_current_user, None)
    client.app.dependency_overrides.pop(get_alpaca_client, None)


def test_rebalance_preview_computes_drift(client: TestClient, setup) -> None:
    _, portfolio_id = setup("reb-1", "pro", [position("AAPL", 6000.0), position("MSFT", 4000.0)])

    plan = client.get("/api/invest/rebalance", params={"portfolio_id": portfolio_id})
    assert plan.status_code == 200, plan.text
    body = plan.json()

    assert body["total_value"] == 10000.0
    assert body["tradable"] is True
    rows = {row["symbol"]: row for row in body["rows"]}

    assert rows["AAPL"]["current_weight"] == pytest.approx(0.6)
    assert rows["AAPL"]["target_weight"] == pytest.approx(0.4)
    assert rows["AAPL"]["delta"] == pytest.approx(-2000.0)
    assert rows["AAPL"]["action"] == "sell"

    assert rows["MSFT"]["delta"] == pytest.approx(2000.0)
    assert rows["MSFT"]["action"] == "buy"

    assert body["max_drift"] == pytest.approx(0.2)


def test_rebalance_sells_untargeted_holding_entirely(client: TestClient, setup) -> None:
    fake, portfolio_id = setup(
        "reb-2", "pro", [position("AAPL", 4000.0), position("MSFT", 6000.0), position("TSLA", 2000.0)]
    )

    plan = client.get("/api/invest/rebalance", params={"portfolio_id": portfolio_id}).json()
    rows = {row["symbol"]: row for row in plan["rows"]}
    assert rows["TSLA"]["target_weight"] == 0.0
    assert rows["TSLA"]["action"] == "sell"

    result = client.post("/api/invest/rebalance", json={"portfolio_id": portfolio_id})
    assert result.status_code == 200, result.text

    assert "TSLA" in fake.closed
    assert all(symbol != "TSLA" for symbol, _, _ in fake.orders)


def test_rebalance_executes_sells_before_buys(client: TestClient, setup) -> None:
    fake, portfolio_id = setup("reb-3", "pro", [position("AAPL", 6000.0), position("MSFT", 4000.0)])

    result = client.post("/api/invest/rebalance", json={"portfolio_id": portfolio_id})
    assert result.status_code == 200, result.text
    body = result.json()

    assert [order["symbol"] for order in body["sells"]] == ["AAPL"]
    assert [order["symbol"] for order in body["buys"]] == ["MSFT"]
    assert body["fee"] == 0.0

    sides = [side for _, _, side in fake.orders]
    assert sides.index("sell") < sides.index("buy")


def test_rebalance_on_free_plan_scales_buys_down_by_fee(client: TestClient, setup) -> None:
    fake, portfolio_id = setup("reb-4", "free", [position("AAPL", 6000.0), position("MSFT", 4000.0)])

    plan = client.get("/api/invest/rebalance", params={"portfolio_id": portfolio_id}).json()
    assert plan["fee_bps"] > 0
    assert plan["fee"] == pytest.approx(2000.0 * plan["fee_bps"] / 10000, abs=0.01)

    result = client.post("/api/invest/rebalance", json={"portfolio_id": portfolio_id})
    assert result.status_code == 200, result.text

    buys = [(symbol, notional) for symbol, notional, side in fake.orders if side == "buy"]
    assert len(buys) == 1
    assert buys[0][1] < 2000.0


def test_rebalance_with_no_holdings_is_not_tradable(client: TestClient, setup) -> None:
    _, portfolio_id = setup("reb-5", "pro", [])

    plan = client.get("/api/invest/rebalance", params={"portfolio_id": portfolio_id}).json()
    assert plan["tradable"] is False
    assert plan["message"]

    result = client.post("/api/invest/rebalance", json={"portfolio_id": portfolio_id})
    assert result.status_code == 400


def test_rebalance_when_already_on_target_is_a_no_op(client: TestClient, setup) -> None:
    _, portfolio_id = setup("reb-6", "pro", [position("AAPL", 4000.0), position("MSFT", 6000.0)])

    plan = client.get("/api/invest/rebalance", params={"portfolio_id": portfolio_id}).json()
    assert plan["tradable"] is False
    assert all(row["action"] == "hold" for row in plan["rows"])


def test_manual_trade_applies_fee_on_buy_for_free_plan(client: TestClient, setup) -> None:
    fake, _ = setup("trade-1", "free", [])

    response = client.post("/api/invest/trade", json={"symbol": "aapl", "side": "buy", "notional": 1000})
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["symbol"] == "AAPL"
    assert body["notional"] < 1000.0
    assert "Fee" in (body["message"] or "")
    assert fake.orders == [("AAPL", body["notional"], "buy")]


def test_manual_sell_takes_no_fee(client: TestClient, setup) -> None:
    fake, _ = setup("trade-2", "free", [position("AAPL", 5000.0)])

    response = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "sell", "notional": 500})
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["notional"] == 500.0
    assert body["message"] is None
    assert fake.orders == [("AAPL", 500.0, "sell")]


def test_manual_trade_below_minimum_is_rejected(client: TestClient, setup) -> None:
    setup("trade-3", "pro", [])

    response = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 0.5})
    assert response.status_code == 400


def test_close_position_trims_by_percentage(client: TestClient, setup) -> None:
    fake, _ = setup("close-1", "pro", [position("AAPL", 5000.0)])

    response = client.delete("/api/invest/positions/aapl", params={"percentage": 50})
    assert response.status_code == 200, response.text
    assert response.json()["symbol"] == "AAPL"
    assert fake.closed == ["AAPL"]
