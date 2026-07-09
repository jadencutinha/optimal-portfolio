import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_access
from app.auth.gating import Access
from app.auth.plans import entitlements_for
from app.behavioral.simulator import BehaviorPolicy, simulate

TRADING_DAYS = 252
LOOKBACK = 20


def _frame(series: dict[str, list[float]]) -> pd.DataFrame:
    index = pd.date_range("2020-01-01", periods=len(next(iter(series.values()))), freq="B")
    return pd.DataFrame(series, index=index)


def _flat_then_crash(n: int = 200, crash_at: int = 100, depth: float = 0.4) -> list[float]:
    prices = [100.0] * crash_at
    bottom = 100.0 * (1.0 - depth)
    prices += list(np.linspace(100.0, bottom, 20))
    prices += list(np.linspace(bottom, 100.0, n - crash_at - 20))
    return prices


def _equal_weight_fn(columns: list[str]):
    def weight_fn(window: pd.DataFrame):
        return pd.Series(1.0 / len(columns), index=columns)

    return weight_fn


def _run(frame: pd.DataFrame, policy: BehaviorPolicy, cost_bps: float = 0.0):
    return simulate(
        frame,
        _equal_weight_fn(list(frame.columns)),
        policy,
        lookback=LOOKBACK,
        cost_bps=cost_bps,
        risk_free_rate=0.0,
        trading_days=TRADING_DAYS,
    )


def test_a_policy_with_no_biases_matches_the_disciplined_path_exactly():
    frame = _frame({"A": _flat_then_crash(), "B": _flat_then_crash()})
    disciplined = _run(frame, BehaviorPolicy(rebalance_every=21))
    same = _run(frame, BehaviorPolicy(rebalance_every=21))
    assert disciplined.equity[-1] == pytest.approx(same.equity[-1])
    assert len(same.panic_dates) == 0


def test_panic_sale_triggers_only_once_the_stated_drawdown_is_breached():
    frame = _frame({"A": _flat_then_crash(depth=0.4), "B": _flat_then_crash(depth=0.4)})

    tolerant = _run(frame, BehaviorPolicy(rebalance_every=21, panic_drawdown=0.90, panic_sell_fraction=0.7, reenter_after_days=30))
    assert len(tolerant.panic_dates) == 0
    assert tolerant.days_derisked == 0

    jumpy = _run(frame, BehaviorPolicy(rebalance_every=21, panic_drawdown=0.10, panic_sell_fraction=0.7, reenter_after_days=30))
    assert len(jumpy.panic_dates) >= 1


def test_days_derisked_equals_reentry_delay_times_panics():
    frame = _frame({"A": _flat_then_crash(depth=0.4), "B": _flat_then_crash(depth=0.4)})
    reenter = 30
    path = _run(frame, BehaviorPolicy(rebalance_every=21, panic_drawdown=0.10, panic_sell_fraction=0.7, reenter_after_days=reenter))
    assert path.days_derisked == reenter * len(path.panic_dates)


def test_panicking_into_a_recovery_costs_money():
    frame = _frame({"A": _flat_then_crash(depth=0.4), "B": _flat_then_crash(depth=0.4)})
    disciplined = _run(frame, BehaviorPolicy(rebalance_every=21))
    panicky = _run(frame, BehaviorPolicy(rebalance_every=21, panic_drawdown=0.10, panic_sell_fraction=0.9, reenter_after_days=60))
    assert len(panicky.panic_dates) >= 1
    assert panicky.equity[-1] < disciplined.equity[-1]


def test_overtrading_pays_strictly_more_in_costs():
    frame = _frame({"A": _flat_then_crash(), "B": list(np.linspace(100.0, 160.0, 200))})
    quarterly = _run(frame, BehaviorPolicy(rebalance_every=63), cost_bps=20.0)
    weekly = _run(frame, BehaviorPolicy(rebalance_every=5), cost_bps=20.0)
    assert weekly.rebalance_count > quarterly.rebalance_count
    assert weekly.total_cost > quarterly.total_cost


def test_disposition_refuses_to_sell_a_loser_and_trims_a_winner():
    losing = list(np.linspace(100.0, 60.0, 200))
    winning = list(np.linspace(100.0, 200.0, 200))
    frame = _frame({"LOSER": losing, "WINNER": winning})

    def tilt_to_winner(window: pd.DataFrame):
        return pd.Series({"LOSER": 0.1, "WINNER": 0.9})

    def run(policy):
        return simulate(
            frame, tilt_to_winner, policy,
            lookback=LOOKBACK, cost_bps=0.0, risk_free_rate=0.0, trading_days=TRADING_DAYS,
        )

    plain = run(BehaviorPolicy(rebalance_every=21))
    disposed = run(BehaviorPolicy(rebalance_every=21, disposition=True))
    assert disposed.equity[-1] != pytest.approx(plain.equity[-1])
    assert disposed.total_turnover != pytest.approx(plain.total_turnover)


def _override(client: TestClient, plan: str) -> None:
    client.app.dependency_overrides[get_access] = lambda: Access(
        plan=plan, user_id="u1", entitlements=entitlements_for(plan)
    )


BODY = {
    "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN"],
    "objective": "max_sharpe",
    "history_days": 1200,
    "estimation_window": 120,
    "rebalance": "quarterly",
    "initial": 10000.0,
    "panic_drawdown": 0.10,
    "loss_aversion": True,
}


def test_endpoint_is_pro_only(client: TestClient):
    _override(client, "free")
    try:
        response = client.post("/api/behavior/gap", json=BODY)
        assert response.status_code == 403
    finally:
        client.app.dependency_overrides.pop(get_access, None)


def test_endpoint_returns_both_paths_and_a_consistent_gap(client: TestClient):
    _override(client, "pro")
    try:
        response = client.post("/api/behavior/gap", json=BODY)
        assert response.status_code == 200, response.text
        body = response.json()
        disciplined = body["disciplined"]["stats"]["final_value"]
        behavioral = body["behavioral"]["stats"]["final_value"]
        assert body["gap_value"] == pytest.approx(disciplined - behavioral)
        assert body["gap_pct"] == pytest.approx((disciplined - behavioral) / disciplined)
        assert body["tolerance"]["stated_tolerance"] == pytest.approx(0.10)
        assert len(body["disciplined"]["curve"]) > 10
        assert [driver["bias"] for driver in body["drivers"]] == ["lossAversion"]
    finally:
        client.app.dependency_overrides.pop(get_access, None)


def test_no_bias_means_no_gap_through_the_endpoint(client: TestClient):
    _override(client, "pro")
    try:
        response = client.post("/api/behavior/gap", json={**BODY, "loss_aversion": False})
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["gap_value"] == pytest.approx(0.0, abs=1e-6)
        assert body["drivers"] == []
    finally:
        client.app.dependency_overrides.pop(get_access, None)
