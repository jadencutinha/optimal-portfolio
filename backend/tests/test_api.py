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
