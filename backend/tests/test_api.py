from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["data_provider"] == "sample"


def test_universe(client: TestClient) -> None:
    response = client.get("/api/universe")
    assert response.status_code == 200
    assert len(response.json()["assets"]) > 0


def test_optimize_min_variance(client: TestClient) -> None:
    payload = {
        "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM"],
        "objective": "min_variance",
        "lookback_days": 500,
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    total = sum(allocation["weight"] for allocation in body["weights"])
    assert abs(total - 1.0) < 1e-2
    assert body["metrics"]["volatility"] > 0
    assert body["n_assets"] == 5


def test_optimize_max_sharpe_returns_run_id(client: TestClient) -> None:
    payload = {
        "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "JNJ"],
        "objective": "max_sharpe",
        "lookback_days": 500,
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200, response.text
    assert response.json()["run_id"] is not None


def test_optimize_rejects_single_ticker(client: TestClient) -> None:
    response = client.post("/api/optimize", json={"tickers": ["AAPL"], "objective": "min_variance"})
    assert response.status_code == 422


def test_optimize_with_ledoit_wolf_reports_shrinkage(client: TestClient) -> None:
    payload = {
        "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "JNJ"],
        "objective": "min_variance",
        "risk_model": "ledoit_wolf",
        "lookback_days": 500,
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["risk_model"] == "ledoit_wolf"
    assert body["covariance_shrinkage"] is not None


def test_optimize_enforces_sector_cap_and_returns_sectors(client: TestClient) -> None:
    payload = {
        "tickers": ["AAPL", "MSFT", "NVDA", "JPM", "XOM", "JNJ"],
        "objective": "max_sharpe",
        "lookback_days": 500,
        "max_weight": 0.5,
        "sector_caps": [{"sector": "Information Technology", "max_weight": 0.3}],
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200, response.text
    allocations = response.json()["weights"]
    weights = {item["ticker"]: item["weight"] for item in allocations}
    tech = sum(weights.get(ticker, 0.0) for ticker in ("AAPL", "MSFT", "NVDA"))
    assert tech <= 0.3 + 1e-2
    assert all("sector" in item for item in allocations)


def test_optimize_infeasible_sector_cap_returns_422(client: TestClient) -> None:
    payload = {
        "tickers": ["AAPL", "MSFT", "NVDA"],
        "objective": "min_variance",
        "lookback_days": 500,
        "sector_caps": [{"sector": "Information Technology", "max_weight": 0.5}],
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 422


def test_me_requires_a_token(client: TestClient) -> None:
    response = client.get("/api/me")
    assert response.status_code == 401


def test_me_rejects_a_malformed_token(client: TestClient) -> None:
    response = client.get("/api/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert response.status_code == 401


def test_set_plan_requires_auth(client: TestClient) -> None:
    response = client.put("/api/me/plan", json={"plan": "pro"})
    assert response.status_code == 401


def test_set_plan_rejects_unknown_plan(client: TestClient) -> None:
    response = client.put("/api/me/plan", json={"plan": "platinum"}, headers={"Authorization": "Bearer x"})
    assert response.status_code in (401, 422)


def test_frontier_endpoint_returns_points(client: TestClient) -> None:
    response = client.get(
        "/api/frontier",
        params={"tickers": "AAPL,MSFT,GOOGL,AMZN,JPM", "lookback_days": 500, "points": 12},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["points"]) >= 3
    volatilities = [point["volatility"] for point in body["points"]]
    assert body["min_variance_index"] == min(range(len(volatilities)), key=lambda i: volatilities[i])
    assert 0 <= body["tangency_index"] < len(body["points"])
