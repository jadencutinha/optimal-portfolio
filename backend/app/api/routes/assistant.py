from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_access, get_provider, get_sector_provider, get_settings
from app.assistant.client import AssistantError
from app.assistant.service import resolve_universe, run_assistant
from app.auth.gating import Access, require_pro
from app.config import Settings
from app.data.provider import DataProvider
from app.data.sectors import SectorProvider
from app.schemas.assistant import AssistantRequest, AssistantResponse

router = APIRouter(tags=["assistant"])


@router.post("/assistant", response_model=AssistantResponse)
async def assistant(
    request: AssistantRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> AssistantResponse:
    require_pro(access.entitlements, "The natural-language assistant")
    universe = resolve_universe(request.tickers)
    sectors = await sector_provider.resolve(universe)
    try:
        return await run_assistant(request, provider, settings, universe, sectors)
    except AssistantError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
