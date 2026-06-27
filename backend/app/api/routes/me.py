from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData
from app.schemas.auth import MeResponse

router = APIRouter(tags=["auth"])


@router.get("/me", response_model=MeResponse)
async def me(user: ProfileData = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=user.id,
        email=user.email,
        plan=user.plan,
        entitlements=entitlements_for(user.plan),
    )
