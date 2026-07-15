from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.auth.repository import ProfileData
from app.invest.market import utcnow

PORTFOLIO = {
    "name": "Target 40/60",
    "objective": "max_sharpe",
    "risk_model": "sample",
    "tickers": ["AAPL", "MSFT"],
    "weights": {"AAPL": 0.4, "MSFT": 0.6},
    "metrics": {"sharpe_ratio": 0.8, "expected_return": 0.12, "volatility": 0.15},
}


def as_user(client: TestClient, uid: str, plan: str = "pro") -> None:
    client.app.dependency_overrides[get_current_user] = lambda: ProfileData(
        id=uid, email=f"{uid}@example.com", plan=plan, plan_selected=True
    )


@pytest.fixture(autouse=True)
def _cleanup(client: TestClient):
    yield
    client.app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def market_open(monkeypatch):
    monkeypatch.setattr("app.invest.simulator.is_market_open", lambda *_: True)
    return True


def test_new_account_starts_at_100k(client: TestClient) -> None:
    as_user(client, "acct-1")
    response = client.get("/api/invest/account")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["cash"] == 100000.0
    assert body["portfolio_value"] == 100000.0
    assert body["long_market_value"] == 0.0
    assert client.get("/api/invest/positions").json() == []


def test_buy_reduces_cash_and_creates_position(client: TestClient, market_open) -> None:
    as_user(client, "buy-1")

    trade = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 1000})
    assert trade.status_code == 200, trade.text
    assert trade.json()["status"] == "filled"

    account = client.get("/api/invest/account").json()
    assert account["cash"] == pytest.approx(99000.0, abs=0.01)
    assert account["portfolio_value"] == pytest.approx(100000.0, abs=1.0)

    positions = client.get("/api/invest/positions").json()
    assert len(positions) == 1
    assert positions[0]["symbol"] == "AAPL"
    assert positions[0]["market_value"] == pytest.approx(1000.0, abs=1.0)


def test_investments_are_isolated_per_user(client: TestClient, market_open) -> None:
    as_user(client, "iso-a")
    client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 5000})
    a_account = client.get("/api/invest/account").json()
    assert a_account["cash"] == pytest.approx(95000.0, abs=0.01)

    as_user(client, "iso-b")
    b_account = client.get("/api/invest/account").json()
    assert b_account["cash"] == 100000.0
    assert client.get("/api/invest/positions").json() == []


def test_free_plan_pays_a_buy_fee(client: TestClient, market_open) -> None:
    as_user(client, "fee-1", plan="free")
    response = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 1000})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["notional"] < 1000.0
    assert "Fee" in (body["message"] or "")


def test_cannot_spend_more_cash_than_you_have(client: TestClient, market_open) -> None:
    as_user(client, "broke-1")
    response = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 250000})
    assert response.status_code == 400
    assert "cash" in response.json()["detail"].lower()


def test_sell_returns_cash(client: TestClient, market_open) -> None:
    as_user(client, "sell-1")
    client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 4000})
    before = client.get("/api/invest/account").json()["cash"]

    sell = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "sell", "notional": 1000})
    assert sell.status_code == 200, sell.text

    after = client.get("/api/invest/account").json()["cash"]
    assert after > before


def test_selling_without_a_position_is_rejected(client: TestClient, market_open) -> None:
    as_user(client, "sell-2")
    response = client.post("/api/invest/trade", json={"symbol": "TSLA", "side": "sell", "notional": 500})
    assert response.status_code == 400


def test_reset_returns_to_starting_balance(client: TestClient, market_open) -> None:
    as_user(client, "reset-1")
    client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 3000})
    assert client.get("/api/invest/account").json()["cash"] == pytest.approx(97000.0, abs=0.01)

    reset = client.delete("/api/invest/positions")
    assert reset.status_code == 200, reset.text

    account = client.get("/api/invest/account").json()
    assert account["cash"] == 100000.0
    assert client.get("/api/invest/positions").json() == []


def test_order_placed_while_market_closed_stays_pending(client: TestClient, monkeypatch) -> None:
    as_user(client, "closed-1")
    future = utcnow() + timedelta(days=1)
    monkeypatch.setattr("app.invest.simulator.is_market_open", lambda *_: False)
    monkeypatch.setattr("app.invest.simulator.next_market_open", lambda *_: future)

    trade = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 2000})
    assert trade.status_code == 200, trade.text
    assert trade.json()["status"] == "new"

    # Cash and holdings are untouched until the order fills at the next open.
    assert client.get("/api/invest/account").json()["cash"] == 100000.0
    assert client.get("/api/invest/positions").json() == []


def test_pending_order_settles_once_its_fill_time_passes(client: TestClient, monkeypatch) -> None:
    as_user(client, "closed-2")
    past = utcnow() - timedelta(hours=1)
    monkeypatch.setattr("app.invest.simulator.is_market_open", lambda *_: False)
    monkeypatch.setattr("app.invest.simulator.next_market_open", lambda *_: past)

    trade = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 2000})
    assert trade.json()["status"] == "new"

    # Its fill time is already in the past, so the next request settles it.
    positions = client.get("/api/invest/positions").json()
    assert len(positions) == 1
    assert positions[0]["symbol"] == "AAPL"

    orders = client.get("/api/invest/orders").json()
    assert orders[0]["status"] == "filled"
    assert client.get("/api/invest/account").json()["cash"] == pytest.approx(98000.0, abs=0.01)


def test_invest_from_weights_places_orders(client: TestClient, market_open) -> None:
    as_user(client, "invest-1")
    response = client.post(
        "/api/invest/orders",
        json={"weights": {"AAPL": 0.5, "MSFT": 0.5}, "amount": 10000},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["invested"] == pytest.approx(10000.0, abs=1.0)
    assert len(body["orders"]) == 2
    assert all(order["status"] == "filled" for order in body["orders"])

    account = client.get("/api/invest/account").json()
    assert account["cash"] == pytest.approx(90000.0, abs=1.0)


def test_rebalance_preview_and_execute(client: TestClient, market_open) -> None:
    as_user(client, "reb-1")
    saved = client.post("/api/portfolios", json=PORTFOLIO)
    assert saved.status_code == 200, saved.text
    portfolio_id = saved.json()["id"]

    # Start holding only AAPL, so a 40/60 AAPL/MSFT target needs a sell and a buy.
    client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 8000})

    preview = client.get("/api/invest/rebalance", params={"portfolio_id": portfolio_id})
    assert preview.status_code == 200, preview.text
    assert preview.json()["tradable"] is True

    result = client.post("/api/invest/rebalance", json={"portfolio_id": portfolio_id})
    assert result.status_code == 200, result.text
    body = result.json()
    symbols = {order["symbol"] for order in body["buys"] + body["sells"]}
    assert "MSFT" in symbols


def test_rebalance_with_no_holdings_is_not_tradable(client: TestClient, market_open) -> None:
    as_user(client, "reb-2")
    saved = client.post("/api/portfolios", json=PORTFOLIO)
    portfolio_id = saved.json()["id"]

    preview = client.get("/api/invest/rebalance", params={"portfolio_id": portfolio_id}).json()
    assert preview["tradable"] is False
    assert preview["message"]

    result = client.post("/api/invest/rebalance", json={"portfolio_id": portfolio_id})
    assert result.status_code == 400


def test_history_reports_starting_and_current_equity(client: TestClient, market_open) -> None:
    as_user(client, "hist-1")
    body = client.get("/api/invest/history", params={"range": "1M"}).json()
    assert body["base_value"] == pytest.approx(100000.0, abs=1.0)
    assert len(body["points"]) >= 2


def test_cancel_pending_order(client: TestClient, monkeypatch) -> None:
    as_user(client, "cancel-1")
    future = utcnow() + timedelta(days=1)
    monkeypatch.setattr("app.invest.simulator.is_market_open", lambda *_: False)
    monkeypatch.setattr("app.invest.simulator.next_market_open", lambda *_: future)

    trade = client.post("/api/invest/trade", json={"symbol": "AAPL", "side": "buy", "notional": 2000})
    assert trade.json()["status"] == "new"

    canceled = client.delete("/api/invest/orders")
    assert canceled.status_code == 200, canceled.text
    assert canceled.json()["canceled"] == 1

    orders = client.get("/api/invest/orders").json()
    assert orders[0]["status"] == "canceled"
    assert client.get("/api/invest/account").json()["cash"] == 100000.0
