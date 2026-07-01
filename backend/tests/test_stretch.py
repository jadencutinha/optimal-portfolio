from fastapi.testclient import TestClient

from app.assistant.client import extract_text, extract_tool_use
from app.assistant.service import DEFAULT_UNIVERSE, build_optimize_request, resolve_universe
from app.planner.montecarlo import simulate

BASE_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM"]


def test_monte_carlo_endpoint(client: TestClient) -> None:
    payload = {
        "expected_return": 0.10,
        "volatility": 0.15,
        "initial": 10000,
        "monthly_contribution": 500,
        "years": 10,
        "target": 100000,
        "trials": 500,
        "seed": 42,
    }
    response = client.post("/api/plan/montecarlo", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["months"] == 120
    assert body["timeline"][0]["month"] == 0
    assert 0.0 <= body["prob_success"] <= 1.0
    assert 0.0 <= body["prob_large_drawdown"] <= 1.0
    assert body["p90_final"] >= body["p10_final"]
    assert body["total_contributions"] == 10000 + 500 * 120


def test_simulate_percentiles_ordered() -> None:
    result = simulate(
        expected_return=0.08,
        volatility=0.15,
        initial=1000,
        monthly_contribution=100,
        years=5,
        target=10000,
        trials=1000,
        seed=1,
    )
    assert result.prob_success is not None
    for point in result.timeline:
        assert point.p10 <= point.p50 <= point.p90


def test_simulate_higher_return_higher_median() -> None:
    low = simulate(expected_return=0.04, volatility=0.10, initial=1000, monthly_contribution=0, years=10, trials=2000, seed=3)
    high = simulate(expected_return=0.12, volatility=0.10, initial=1000, monthly_contribution=0, years=10, trials=2000, seed=3)
    assert high.median_final > low.median_final


def test_explain_endpoint(client: TestClient) -> None:
    payload = {
        "tickers": BASE_TICKERS,
        "objective": "max_sharpe",
        "lookback_days": 500,
        "max_weight": 0.35,
    }
    response = client.post("/api/optimize/explain", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    total_rc = sum(row["risk_contribution"] for row in body["contributions"])
    assert abs(total_rc - 1.0) < 1e-2
    assert body["effective_holdings"] >= 1.0
    assert len(body["counterfactuals"]) >= 1
    assert body["counterfactuals"][0]["label"] == "Equal weight"
    assert body["top_risk_driver"] in BASE_TICKERS


def test_explain_binding_cap(client: TestClient) -> None:
    payload = {
        "tickers": BASE_TICKERS,
        "objective": "max_sharpe",
        "lookback_days": 500,
        "max_weight": 0.25,
    }
    response = client.post("/api/optimize/explain", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    if body["binding_max_weight"]:
        labels = [cf["label"] for cf in body["counterfactuals"]]
        assert any(label.startswith("Relax cap") for label in labels)


def test_assistant_unconfigured(client: TestClient) -> None:
    response = client.post("/api/assistant", json={"message": "I want steady growth with low risk"})
    assert response.status_code == 503, response.text


def test_resolve_universe_defaults() -> None:
    assert resolve_universe(None) == DEFAULT_UNIVERSE
    assert resolve_universe(["aapl"]) == DEFAULT_UNIVERSE
    assert resolve_universe(["aapl", "msft", "aapl"]) == ["AAPL", "MSFT"]


def test_build_optimize_request_defaults() -> None:
    request = build_optimize_request(
        {"objective": "max_sharpe", "risk_model": "sample", "max_weight": 0.3, "rationale": "x"},
        DEFAULT_UNIVERSE,
    )
    assert request.objective == "max_sharpe"
    assert request.risk_model == "sample"
    assert len(request.tickers) >= 2


def test_build_optimize_request_invalid_falls_back() -> None:
    request = build_optimize_request(
        {"objective": "nonsense", "risk_model": "bogus", "max_weight": 0.01, "target_return": None, "rationale": ""},
        DEFAULT_UNIVERSE,
    )
    assert request.objective == "max_sharpe"
    assert request.risk_model == "ledoit_wolf"
    assert request.max_weight >= 1.0 / len(request.tickers) - 1e-9


def test_build_optimize_request_target_return() -> None:
    request = build_optimize_request(
        {"objective": "target_return", "risk_model": "sample", "max_weight": 0.4, "target_return": 0.12, "rationale": "r"},
        DEFAULT_UNIVERSE,
    )
    assert request.objective == "target_return"
    assert request.target_return == 0.12


def test_hrp_optimize_endpoint(client: TestClient) -> None:
    payload = {"tickers": BASE_TICKERS, "objective": "hrp", "lookback_days": 500}
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    total = sum(allocation["weight"] for allocation in body["weights"])
    assert abs(total - 1.0) < 1e-2
    assert all(allocation["weight"] >= -1e-9 for allocation in body["weights"])
    assert body["objective"] == "hrp"


def test_hrp_allocator_diversifies() -> None:
    import numpy as np

    from app.optimizer.hrp import hierarchical_risk_parity

    rng = np.random.default_rng(1)
    data = rng.normal(size=(400, 5))
    data[:, 1] += 0.9 * data[:, 0]
    cov = np.cov(data, rowvar=False)
    weights, status = hierarchical_risk_parity(cov)
    assert status == "optimal"
    assert abs(weights.sum() - 1.0) < 1e-9
    assert (weights > 0).all()


def test_stress_endpoint(client: TestClient) -> None:
    payload = {"tickers": BASE_TICKERS, "objective": "max_sharpe", "lookback_days": 500}
    response = client.post("/api/stress", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    keys = {window["key"] for window in body["windows"]}
    assert keys == {"gfc_2008", "covid_2020", "rate_shock_2022"}
    for window in body["windows"]:
        if window["available"]:
            assert window["max_drawdown"] <= 0.0
            assert window["total_return"] is not None
            assert len(window["curve"]) >= 2


def test_resampled_frontier_endpoint(client: TestClient) -> None:
    payload = {
        "tickers": BASE_TICKERS,
        "risk_model": "sample",
        "lookback_days": 500,
        "points": 6,
        "resamples": 5,
    }
    response = client.post("/api/frontier/resampled", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["sample"]) == 6
    assert len(body["resampled"]) == 6
    assert body["resamples"] >= 1
    for point in body["resampled"]:
        total = sum(allocation["weight"] for allocation in point["weights"])
        assert abs(total - 1.0) < 1e-2


def test_extract_helpers() -> None:
    data = {
        "content": [
            {"type": "tool_use", "name": "configure_portfolio", "input": {"objective": "max_sharpe"}},
            {"type": "text", "text": "hello"},
        ]
    }
    assert extract_tool_use(data, "configure_portfolio") == {"objective": "max_sharpe"}
    assert extract_tool_use(data, "missing") is None
    assert extract_text(data) == "hello"
