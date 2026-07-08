from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_supabase_admin
from app.auth.repository import ProfileData

PAYLOAD = {
    "name": "My Max Sharpe",
    "objective": "max_sharpe",
    "risk_model": "sample",
    "tickers": ["AAPL", "MSFT"],
    "weights": {"AAPL": 0.6, "MSFT": 0.4},
    "metrics": {"sharpe_ratio": 0.8, "expected_return": 0.12, "volatility": 0.15},
}


def as_user(client: TestClient, uid: str, plan: str = "pro") -> None:
    client.app.dependency_overrides[get_current_user] = lambda: ProfileData(
        id=uid, email=f"{uid}@example.com", plan=plan, plan_selected=True
    )


def clear(client: TestClient) -> None:
    client.app.dependency_overrides.pop(get_current_user, None)


def test_save_list_get_delete(client: TestClient) -> None:
    as_user(client, "pf-user", "pro")
    try:
        created = client.post("/api/portfolios", json=PAYLOAD)
        assert created.status_code == 200, created.text
        portfolio_id = created.json()["id"]

        listing = client.get("/api/portfolios").json()
        assert any(item["id"] == portfolio_id for item in listing)

        detail = client.get(f"/api/portfolios/{portfolio_id}").json()
        assert detail["weights"]["AAPL"] == 0.6

        deleted = client.delete(f"/api/portfolios/{portfolio_id}")
        assert deleted.status_code == 204
        assert client.get(f"/api/portfolios/{portfolio_id}").status_code == 404
    finally:
        clear(client)


def test_free_plan_save_limit(client: TestClient) -> None:
    as_user(client, "pf-free", "free")
    try:
        for i in range(3):
            assert client.post("/api/portfolios", json={**PAYLOAD, "name": f"p{i}"}).status_code == 200
        blocked = client.post("/api/portfolios", json={**PAYLOAD, "name": "p4"})
        assert blocked.status_code == 403
    finally:
        clear(client)


def test_portfolios_are_scoped_to_user(client: TestClient) -> None:
    as_user(client, "owner", "pro")
    client.post("/api/portfolios", json=PAYLOAD)
    owned_id = client.get("/api/portfolios").json()[0]["id"]
    clear(client)

    as_user(client, "intruder", "pro")
    try:
        assert client.get(f"/api/portfolios/{owned_id}").status_code == 404
        assert client.delete(f"/api/portfolios/{owned_id}").status_code == 404
    finally:
        clear(client)


def test_portfolio_requires_auth(client: TestClient) -> None:
    assert client.get("/api/portfolios").status_code == 401


class _FakeAdmin:
    def __init__(self) -> None:
        self.deleted: list[str] = []

    async def delete_user(self, user_id: str) -> None:
        self.deleted.append(user_id)


def test_delete_account_removes_data_and_auth_user(client: TestClient) -> None:
    admin = _FakeAdmin()
    as_user(client, "goodbye", "pro")
    client.app.dependency_overrides[get_supabase_admin] = lambda: admin
    try:
        assert client.post("/api/portfolios", json=PAYLOAD).status_code == 200
        assert len(client.get("/api/portfolios").json()) == 1

        response = client.delete("/api/me")
        assert response.status_code == 204, response.text
        assert admin.deleted == ["goodbye"]
        assert client.get("/api/portfolios").json() == []
    finally:
        client.app.dependency_overrides.pop(get_supabase_admin, None)
        clear(client)


def test_delete_account_requires_auth(client: TestClient) -> None:
    assert client.delete("/api/me").status_code == 401
