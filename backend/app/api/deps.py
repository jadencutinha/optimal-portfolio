from fastapi import Depends, Header, HTTPException, Request

from app.auth.repository import ProfileData, ProfileRepository
from app.auth.supabase import AuthError, SupabaseVerifier
from app.config import Settings
from app.data.provider import DataProvider
from app.data.repository import PriceRepository
from app.data.sectors import SectorProvider
from app.optimizer.repository import OptimizationRepository


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_provider(request: Request) -> DataProvider:
    return request.app.state.provider


def get_sector_provider(request: Request) -> SectorProvider:
    return request.app.state.sector_provider


def get_verifier(request: Request) -> SupabaseVerifier:
    return request.app.state.verifier


def get_profile_repository(request: Request) -> ProfileRepository:
    return request.app.state.profile_repository


async def get_current_user(
    authorization: str | None = Header(default=None),
    verifier: SupabaseVerifier = Depends(get_verifier),
    profiles: ProfileRepository = Depends(get_profile_repository),
) -> ProfileData:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        claims = verifier.verify(token)
    except AuthError as error:
        raise HTTPException(status_code=401, detail="Invalid authentication token.") from error
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token is missing a subject.")
    return await profiles.get_or_create(user_id, claims.get("email"))


def get_optimization_repository(request: Request) -> OptimizationRepository:
    return request.app.state.optimization_repository


def get_price_repository(request: Request) -> PriceRepository:
    return request.app.state.price_repository
