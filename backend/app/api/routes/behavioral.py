from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_access, get_provider, get_settings
from app.auth.gating import Access, require_pro
from app.behavioral.service import run_behavior_gap
from app.behavioral.simulator import BehavioralError
from app.config import Settings
from app.data.provider import DataProvider
from app.schemas.behavioral import BehaviorGapRequest, BehaviorGapResponse

router = APIRouter(tags=["behavioral"])


@router.post("/behavior/gap", response_model=BehaviorGapResponse)
async def behavior_gap(
    request: BehaviorGapRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    access: Access = Depends(get_access),
) -> BehaviorGapResponse:
    require_pro(access.entitlements, "The behavioral coach")
    try:
        return await run_behavior_gap(request, provider, settings)
    except BehavioralError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
