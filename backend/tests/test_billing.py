import json
from types import SimpleNamespace

import pytest
import stripe
from fastapi.testclient import TestClient

from app.api.deps import get_current_user


@pytest.fixture
def billing_client(monkeypatch, tmp_path):
    monkeypatch.setenv("DATA_PROVIDER", "sample")
    monkeypatch.setenv("REDIS_URL", "")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setenv("STRIPE_PUBLISHABLE_KEY", "pk_test_x")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_x")
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path}/billing.db")

    from app.config import get_settings

    get_settings.cache_clear()

    from app.main import create_app

    with TestClient(create_app()) as client:

        async def current_user():
            return await client.app.state.profile_repository.get_or_create("pay-1", "pay@example.com")

        client.app.dependency_overrides[get_current_user] = current_user
        yield client

    get_settings.cache_clear()


def _patch_customer(monkeypatch):
    monkeypatch.setattr(stripe.Customer, "create", lambda **_: SimpleNamespace(id="cus_test"))


def test_config_reports_enabled(billing_client: TestClient) -> None:
    body = billing_client.get("/api/billing/config").json()
    assert body["enabled"] is True
    assert body["publishable_key"] == "pk_test_x"
    assert body["price_amount_cents"] == 2900


def test_checkout_session_returns_a_client_secret(billing_client: TestClient, monkeypatch) -> None:
    _patch_customer(monkeypatch)
    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        lambda **_: SimpleNamespace(client_secret="cs_secret_123", id="cs_test"),
    )

    response = billing_client.post("/api/billing/checkout-session")
    assert response.status_code == 200, response.text
    assert response.json()["client_secret"] == "cs_secret_123"


def test_confirm_upgrades_to_pro_when_subscription_is_active(billing_client: TestClient, monkeypatch) -> None:
    _patch_customer(monkeypatch)
    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        lambda **_: SimpleNamespace(client_secret="cs_secret_123", id="cs_test"),
    )
    # Create the customer record first (as the real flow does).
    billing_client.post("/api/billing/checkout-session")

    monkeypatch.setattr(
        stripe.Subscription,
        "list",
        lambda **_: SimpleNamespace(data=[SimpleNamespace(id="sub_test", status="active")]),
    )

    confirm = billing_client.post("/api/billing/confirm")
    assert confirm.status_code == 200, confirm.text
    assert confirm.json()["pro"] is True

    assert billing_client.get("/api/me").json()["plan"] == "pro"


def test_confirm_does_not_upgrade_without_an_active_subscription(billing_client: TestClient, monkeypatch) -> None:
    _patch_customer(monkeypatch)
    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        lambda **_: SimpleNamespace(client_secret="cs_secret_123", id="cs_test"),
    )
    billing_client.post("/api/billing/checkout-session")

    monkeypatch.setattr(stripe.Subscription, "list", lambda **_: SimpleNamespace(data=[]))

    confirm = billing_client.post("/api/billing/confirm")
    assert confirm.json()["pro"] is False
    assert billing_client.get("/api/me").json()["plan"] == "free"


def test_webhook_completed_upgrades_to_pro(billing_client: TestClient, monkeypatch) -> None:
    billing_client.get("/api/me")  # ensure the profile exists, as it would after login
    event = {
        "type": "checkout.session.completed",
        "data": {"object": {"metadata": {"user_id": "pay-1"}, "subscription": "sub_test"}},
    }
    monkeypatch.setattr(stripe.Webhook, "construct_event", lambda *args, **kwargs: event)

    response = billing_client.post(
        "/api/billing/webhook",
        content=json.dumps(event),
        headers={"stripe-signature": "t=1,v1=fake"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["received"] is True

    assert billing_client.get("/api/me").json()["plan"] == "pro"


def test_webhook_subscription_deleted_downgrades(billing_client: TestClient, monkeypatch) -> None:
    billing_client.get("/api/me")  # ensure the profile exists, as it would after login
    upgrade = {
        "type": "checkout.session.completed",
        "data": {"object": {"metadata": {"user_id": "pay-1"}, "subscription": "sub_test"}},
    }
    monkeypatch.setattr(stripe.Webhook, "construct_event", lambda *a, **k: upgrade)
    billing_client.post("/api/billing/webhook", content="{}", headers={"stripe-signature": "x"})
    assert billing_client.get("/api/me").json()["plan"] == "pro"

    cancel = {
        "type": "customer.subscription.deleted",
        "data": {"object": {"metadata": {"user_id": "pay-1"}, "id": "sub_test", "status": "canceled"}},
    }
    monkeypatch.setattr(stripe.Webhook, "construct_event", lambda *a, **k: cancel)
    billing_client.post("/api/billing/webhook", content="{}", headers={"stripe-signature": "x"})
    assert billing_client.get("/api/me").json()["plan"] == "free"
