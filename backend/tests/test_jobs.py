from fastapi.testclient import TestClient


def test_sweep_streams_and_completes(client: TestClient) -> None:
    payload = {
        "tickers": ["AAPL", "MSFT", "GOOGL", "JPM"],
        "lookback_days": 400,
        "objectives": ["max_sharpe", "min_variance"],
        "risk_models": ["sample", "ledoit_wolf"],
    }
    response = client.post("/api/jobs/sweep", json=payload)
    assert response.status_code == 200, response.text
    job_id = response.json()["job_id"]
    assert response.json()["total"] == 4

    events = []
    with client.websocket_connect(f"/api/jobs/{job_id}/ws") as ws:
        while True:
            message = ws.receive_json()
            events.append(message)
            if message["type"] in ("done", "error"):
                break

    assert events[0]["type"] == "snapshot"
    assert events[-1]["type"] == "done"

    status = client.get(f"/api/jobs/{job_id}").json()
    assert status["status"] == "done"
    assert len(status["result"]["cells"]) == 4
    assert all("sharpe_ratio" in cell for cell in status["result"]["cells"])


def test_unknown_job_returns_404(client: TestClient) -> None:
    assert client.get("/api/jobs/missing").status_code == 404


def test_unknown_job_websocket_reports_error(client: TestClient) -> None:
    with client.websocket_connect("/api/jobs/missing/ws") as ws:
        assert ws.receive_json()["type"] == "error"
