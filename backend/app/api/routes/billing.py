from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import get_billing, get_current_user
from app.auth.repository import ProfileData
from app.billing.service import BillingError, StripeBilling

router = APIRouter(tags=["billing"])


@router.get("/billing/config")
async def billing_config(billing: StripeBilling = Depends(get_billing)) -> dict[str, Any]:
    return billing.config()


@router.post("/billing/checkout-session")
async def create_checkout_session(
    user: ProfileData = Depends(get_current_user),
    billing: StripeBilling = Depends(get_billing),
) -> dict[str, str]:
    try:
        return await billing.create_checkout_session(user)
    except BillingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/billing/confirm")
async def confirm_checkout(
    user: ProfileData = Depends(get_current_user),
    billing: StripeBilling = Depends(get_billing),
) -> dict[str, bool]:
    try:
        return {"pro": await billing.confirm(user)}
    except BillingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/billing/webhook")
async def stripe_webhook(
    request: Request,
    billing: StripeBilling = Depends(get_billing),
) -> dict[str, bool]:
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        await billing.handle_event(payload, signature)
    except BillingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return {"received": True}
