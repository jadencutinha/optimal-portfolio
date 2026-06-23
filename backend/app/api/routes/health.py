from fastapi import APIRouter, Depends

from app.api.deps import get_settings
from app.config import Settings
from app.data.provider import resolve_provider_name
from app.schemas.common import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        data_provider=resolve_provider_name(settings),
    )
