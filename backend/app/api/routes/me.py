from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user, get_profile_repository
from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData, ProfileRepository
from app.schemas.auth import MeResponse, PlanUpdate

router = APIRouter(tags=["auth"])


def _to_response(user: ProfileData) -> MeResponse:
    return MeResponse(
        id=user.id,
        email=user.email,
        plan=user.plan,
        plan_selected=user.plan_selected,
        entitlements=entitlements_for(user.plan),
    )


@router.get("/me", response_model=MeResponse)
async def me(user: ProfileData = Depends(get_current_user)) -> MeResponse:
    return _to_response(user)


@router.put("/me/plan", response_model=MeResponse)
async def set_plan(
    payload: PlanUpdate,
    user: ProfileData = Depends(get_current_user),
    profiles: ProfileRepository = Depends(get_profile_repository),
) -> MeResponse:
    updated = await profiles.set_plan(user.id, payload.plan)
    if updated is None:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return _to_response(updated)
