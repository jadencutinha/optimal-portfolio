from fastapi import APIRouter

from app.data.universe import UNIVERSE
from app.schemas.common import UniverseAsset, UniverseResponse

router = APIRouter(tags=["universe"])


@router.get("/universe", response_model=UniverseResponse)
async def universe() -> UniverseResponse:
    return UniverseResponse(assets=[UniverseAsset(**asset) for asset in UNIVERSE])
