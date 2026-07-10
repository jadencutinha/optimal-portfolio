from fastapi import Depends, Header, HTTPException, Request

from app.auth.gating import Access
from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData, ProfileRepository
from app.auth.supabase import AuthError, SupabaseAdmin, SupabaseVerifier
from app.backtest.repository import BacktestRepository
from app.config import Settings
from app.data.cache import Cache
from app.data.provider import DataProvider
from app.data.repository import PriceRepository
from app.data.sectors import SectorProvider
from app.education.repository import CourseRepository
from app.invest.client import AlpacaClient
from app.jobs.manager import JobManager
from app.observability.metrics import MetricsCollector
from app.optimizer.repository import OptimizationRepository
from app.portfolios.repository import PortfolioRepository


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_alpaca_client(request: Request) -> AlpacaClient:
    return AlpacaClient(request.app.state.settings)


def get_provider(request: Request) -> DataProvider:
    return request.app.state.provider


def get_cache(request: Request) -> Cache:
    return request.app.state.cache


def get_sector_provider(request: Request) -> SectorProvider:
    return request.app.state.sector_provider


def get_backtest_repository(request: Request) -> BacktestRepository:
    return request.app.state.backtest_repository


def get_job_manager(request: Request) -> JobManager:
    return request.app.state.job_manager


def get_course_repository(request: Request) -> CourseRepository:
    return request.app.state.course_repository


def get_portfolio_repository(request: Request) -> PortfolioRepository:
    return request.app.state.portfolio_repository


def get_verifier(request: Request) -> SupabaseVerifier:
    return request.app.state.verifier


def get_supabase_admin(request: Request) -> SupabaseAdmin:
    return request.app.state.supabase_admin


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


async def get_access(
    authorization: str | None = Header(default=None),
    verifier: SupabaseVerifier = Depends(get_verifier),
    profiles: ProfileRepository = Depends(get_profile_repository),
) -> Access:
    plan = "pro"
    user_id = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            claims = verifier.verify(token)
            user_id = claims.get("sub")
            if user_id:
                profile = await profiles.get_or_create(user_id, claims.get("email"))
                plan = profile.plan
        except AuthError:
            plan = "pro"
    return Access(plan=plan, user_id=user_id, entitlements=entitlements_for(plan))


def get_optimization_repository(request: Request) -> OptimizationRepository:
    return request.app.state.optimization_repository


def get_price_repository(request: Request) -> PriceRepository:
    return request.app.state.price_repository


def get_metrics(request: Request) -> MetricsCollector:
    return request.app.state.metrics
