from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.deps import get_access, get_provider, get_sector_provider, get_settings
from app.auth.gating import Access, check_optimize
from app.config import Settings
from app.data.provider import DataProvider
from app.data.sectors import SectorProvider
from app.optimizer.risk_models import RISK_MODELS, RiskModel
from app.optimizer.service import OptimizationServiceError, run_frontier, run_resampled_frontier
from app.ratelimit import HEAVY, limiter
from app.schemas.optimize import FrontierResponse, ResampledFrontierRequest, ResampledFrontierResponse

router = APIRouter(tags=["frontier"])


@router.get("/frontier", response_model=FrontierResponse)
@limiter.limit(HEAVY)
async def frontier(
    request: Request,
    tickers: str = Query(..., description="Comma separated list of tickers"),
    lookback_days: int | None = Query(default=None, ge=30, le=3650),
    min_weight: float = Query(default=0.0, ge=-1.0, le=1.0),
    max_weight: float = Query(default=1.0, gt=0.0, le=1.0),
    risk_model: RiskModel = Query(default="sample"),
    points: int = Query(default=25, ge=2, le=100),
    risk_free_rate: float | None = Query(default=None, ge=0.0, le=1.0),
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> FrontierResponse:
    symbols = [symbol.strip().upper() for symbol in tickers.split(",") if symbol.strip()]
    if len(symbols) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two tickers.")
    if risk_model not in RISK_MODELS:
        raise HTTPException(status_code=400, detail="Unknown risk model.")

    check_optimize(
        tickers=symbols,
        objective="min_variance",
        risk_model=risk_model,
        return_model="historical",
        lookback_days=lookback_days,
        entitlements=access.entitlements,
    )

    sectors = await sector_provider.resolve(symbols)
    try:
        return await run_frontier(
            tickers=symbols,
            lookback_days=lookback_days,
            min_weight=min_weight,
            max_weight=max_weight,
            risk_model=risk_model,
            n_points=points,
            risk_free_rate=risk_free_rate,
            provider=provider,
            settings=settings,
            sectors=sectors,
        )
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/frontier/resampled", response_model=ResampledFrontierResponse)
@limiter.limit(HEAVY)
async def resampled_frontier(
    request: Request,
    payload: ResampledFrontierRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> ResampledFrontierResponse:
    check_optimize(
        tickers=payload.tickers,
        objective="min_variance",
        risk_model=payload.risk_model,
        return_model="historical",
        lookback_days=payload.lookback_days,
        entitlements=access.entitlements,
    )
    sectors = await sector_provider.resolve(payload.tickers)
    try:
        return await run_resampled_frontier(
            tickers=payload.tickers,
            lookback_days=payload.lookback_days,
            min_weight=payload.min_weight,
            max_weight=payload.max_weight,
            risk_model=payload.risk_model,
            n_points=payload.points,
            n_resamples=payload.resamples,
            risk_free_rate=payload.risk_free_rate,
            provider=provider,
            settings=settings,
            sectors=sectors,
        )
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
