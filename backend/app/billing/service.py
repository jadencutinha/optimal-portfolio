from __future__ import annotations

import logging
from typing import Any

import stripe
from starlette.concurrency import run_in_threadpool

from app.auth.repository import ProfileData, ProfileRepository
from app.billing.repository import BillingRepository
from app.config import Settings

logger = logging.getLogger("optimal_portfolio.billing")

_ACTIVE_STATES = {"active", "trialing", "past_due"}
_DEAD_STATES = {"canceled", "unpaid", "incomplete_expired"}


class BillingError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class StripeBilling:
    def __init__(
        self,
        settings: Settings,
        billing: BillingRepository,
        profiles: ProfileRepository,
    ) -> None:
        self._settings = settings
        self._billing = billing
        self._profiles = profiles
        if settings.stripe_secret_key:
            stripe.api_key = settings.stripe_secret_key

    @property
    def enabled(self) -> bool:
        return self._settings.stripe_enabled

    def config(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "publishable_key": self._settings.stripe_publishable_key or "",
            "price_amount_cents": self._settings.stripe_price_amount_cents,
            "currency": self._settings.stripe_currency,
            "product_name": self._settings.stripe_product_name,
        }

    async def _ensure_customer(self, user: ProfileData) -> str:
        record = await self._billing.get(user.id)
        if record is not None:
            return record.stripe_customer_id
        customer = await run_in_threadpool(
            lambda: stripe.Customer.create(email=user.email or None, metadata={"user_id": user.id})
        )
        await self._billing.upsert_customer(user.id, customer.id)
        return customer.id

    async def create_checkout_session(self, user: ProfileData) -> dict[str, str]:
        if not self.enabled:
            raise BillingError("Stripe is not configured on the server.", 503)
        customer_id = await self._ensure_customer(user)
        try:
            session = await run_in_threadpool(
                lambda: stripe.checkout.Session.create(
                    mode="subscription",
                    ui_mode="embedded",
                    customer=customer_id,
                    redirect_on_completion="never",
                    line_items=[
                        {
                            "quantity": 1,
                            "price_data": {
                                "currency": self._settings.stripe_currency,
                                "unit_amount": self._settings.stripe_price_amount_cents,
                                "recurring": {"interval": "month"},
                                "product_data": {"name": self._settings.stripe_product_name},
                            },
                        }
                    ],
                    subscription_data={"metadata": {"user_id": user.id}},
                    metadata={"user_id": user.id},
                )
            )
        except stripe.StripeError as error:
            raise BillingError(_message(error), 502) from error
        return {"client_secret": session.client_secret or "", "session_id": session.id}

    async def confirm(self, user: ProfileData) -> bool:
        """Re-check Stripe after checkout completes and upgrade the plan if the subscription is live."""
        if not self.enabled:
            return False
        record = await self._billing.get(user.id)
        if record is None:
            return False
        try:
            subscriptions = await run_in_threadpool(
                lambda: stripe.Subscription.list(customer=record.stripe_customer_id, status="all", limit=10)
            )
        except stripe.StripeError as error:
            raise BillingError(_message(error), 502) from error
        active = next((sub for sub in subscriptions.data if sub.status in _ACTIVE_STATES), None)
        if active is None:
            return False
        await self._billing.set_subscription(user.id, active.id, active.status)
        await self._profiles.set_plan(user.id, "pro")
        return True

    async def _resolve_user_id(self, obj: dict[str, Any]) -> str | None:
        metadata = obj.get("metadata") or {}
        user_id = metadata.get("user_id")
        if user_id:
            return user_id
        customer_id = obj.get("customer")
        if isinstance(customer_id, str):
            record = await self._billing.get_by_customer(customer_id)
            if record is not None:
                return record.user_id
        return None

    async def handle_event(self, payload: bytes, signature: str) -> None:
        if not self._settings.stripe_webhook_secret:
            raise BillingError("Stripe webhook secret is not configured.", 503)
        try:
            event = stripe.Webhook.construct_event(payload, signature, self._settings.stripe_webhook_secret)
        except (ValueError, stripe.SignatureVerificationError) as error:
            raise BillingError("Invalid webhook signature.", 400) from error

        event_type = event["type"]
        obj = event["data"]["object"]
        user_id = await self._resolve_user_id(obj)
        if user_id is None:
            logger.warning("Stripe webhook %s had no resolvable user", event_type)
            return

        if event_type == "checkout.session.completed":
            subscription_id = obj.get("subscription")
            await self._billing.set_subscription(user_id, subscription_id, "active")
            await self._profiles.set_plan(user_id, "pro")
        elif event_type in ("customer.subscription.created", "customer.subscription.updated"):
            status = obj.get("status")
            await self._billing.set_subscription(user_id, obj.get("id"), status)
            if status in _ACTIVE_STATES:
                await self._profiles.set_plan(user_id, "pro")
            elif status in _DEAD_STATES:
                await self._profiles.set_plan(user_id, "free")
        elif event_type == "customer.subscription.deleted":
            await self._billing.set_subscription(user_id, None, "canceled")
            await self._profiles.set_plan(user_id, "free")


def _message(error: stripe.StripeError) -> str:
    user_message = getattr(error, "user_message", None)
    return user_message or "Payment processing failed. Try again in a moment."
