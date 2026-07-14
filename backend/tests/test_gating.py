from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_access
from app.auth.gating import Access
from app.auth.plans import PLANS, entitlements_for, normalize_plan


def _as_plan(plan: str, user_id: str | None = None) -> Access:
    return Access(plan=plan, user_id=user_id, entitlements=entitlements_for(plan))


def override(client: TestClient, plan: str, user_id: str | None = None) -> Iterator[None]:
    client.app.dependency_overrides[get_access] = lambda: _as_plan(plan, user_id)


def clear(client: TestClient) -> None:
    client.app.dependency_overrides.pop(get_access, None)


BASIC = {"tickers": ["AAPL", "MSFT", "GOOGL"], "objective": "min_variance", "lookback_days": 500}


def test_free_allows_a_basic_request(client: TestClient) -> None:
    override(client, "free")
    try:
        response = client.post("/api/optimize", json=BASIC)
        assert response.status_code == 200, response.text
    finally:
        clear(client)


def test_free_blocks_advanced_objective(client: TestClient) -> None:
    override(client, "free")
    try:
        response = client.post("/api/optimize", json={**BASIC, "objective": "risk_parity"})
        assert response.status_code == 403
        assert "Pro" in response.json()["detail"]
    finally:
        clear(client)


def test_free_blocks_non_sample_risk_model(client: TestClient) -> None:
    override(client, "free")
    try:
        response = client.post("/api/optimize", json={**BASIC, "risk_model": "ledoit_wolf"})
        assert response.status_code == 403
    finally:
        clear(client)


def test_free_blocks_too_many_tickers(client: TestClient) -> None:
    override(client, "free")
    try:
        tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "JNJ", "XOM", "PG", "KO", "WMT"]
        response = client.post("/api/optimize", json={"tickers": tickers, "objective": "min_variance"})
        assert response.status_code == 403
    finally:
        clear(client)


def test_pro_allows_advanced_objective_and_risk_model(client: TestClient) -> None:
    override(client, "pro")
    try:
        response = client.post(
            "/api/optimize",
            json={"tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM"], "objective": "cvar", "risk_model": "factor", "lookback_days": 500},
        )
        assert response.status_code == 200, response.text
    finally:
        clear(client)


def test_free_blocks_backtest(client: TestClient) -> None:
    override(client, "free")
    try:
        response = client.post(
            "/api/backtest", json={"tickers": ["AAPL", "MSFT", "GOOGL", "JPM"], "estimation_window": 120, "history_days": 500}
        )
        assert response.status_code == 403
    finally:
        clear(client)


def test_free_daily_quota_enforced(client: TestClient) -> None:
    override(client, "free", user_id="quota-user")
    try:
        successes = 0
        blocked = False
        for _ in range(12):
            response = client.post("/api/optimize", json=BASIC)
            if response.status_code == 200:
                successes += 1
            elif response.status_code == 403 and "limit" in response.json()["detail"].lower():
                blocked = True
                break
        assert successes == 10
        assert blocked
    finally:
        clear(client)


@pytest.mark.parametrize("plan", ["free", "pro"])
def test_known_plans_resolve_entitlements(plan: str) -> None:
    assert entitlements_for(plan)["max_tickers"] >= 8


def test_legacy_course_plan_normalizes_to_free() -> None:
    assert normalize_plan("course") == "free"
    assert normalize_plan("nonsense") == "free"
    assert entitlements_for("course") == entitlements_for("free")


def test_every_plan_can_reach_the_course() -> None:
    for plan in PLANS:
        assert entitlements_for(plan)["course_access"] is True


def test_pro_keeps_its_entitlements_alongside_course_access() -> None:
    pro = entitlements_for("pro")
    assert pro["max_tickers"] == 50
    assert pro["advanced_optimizers"] is True
    assert pro["trade_fee_bps"] == 0
    assert pro["saved_portfolios"] is None
