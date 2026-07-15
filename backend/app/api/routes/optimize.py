from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import (
    get_access,
    get_cache,
    get_optimization_repository,
    get_price_repository,
    get_provider,
    get_sector_provider,
    get_settings,
)
from app.ratelimit import HEAVY, limiter
from app.auth.gating import Access, check_optimize, enforce_quota
from app.config import Settings
from app.data.cache import Cache
from app.data.provider import DataProvider
from app.data.repository import PriceRepository
from app.data.sectors import SectorProvider
from app.optimizer.repository import OptimizationRepository
from app.optimizer.service import OptimizationServiceError, run_explanation, run_optimization
from app.schemas.common import OptimizationRunDetail, OptimizationRunSummary
from app.schemas.explain import ExplainResponse
from app.schemas.optimize import OptimizeRequest, OptimizeResponse

router = APIRouter(tags=["optimize"])


@router.post("/optimize", response_model=OptimizeResponse)
@limiter.limit(HEAVY)
async def optimize(
    request: Request,
    payload: OptimizeRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
    cache: Cache = Depends(get_cache),
    optimization_repository: OptimizationRepository = Depends(get_optimization_repository),
    price_repository: PriceRepository = Depends(get_price_repository),
) -> OptimizeResponse:
    check_optimize(
        tickers=payload.tickers,
        objective=payload.objective,
        risk_model=payload.risk_model,
        return_model=payload.return_model,
        lookback_days=payload.lookback_days,
        entitlements=access.entitlements,
    )
    await enforce_quota(access, cache)

    sectors = await sector_provider.resolve(payload.tickers)
    try:
        response, frame = await run_optimization(payload, provider, settings, sectors)
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    try:
        await price_repository.store_prices(provider.name, frame)
    except Exception:
        pass

    try:
        response.run_id = await optimization_repository.save(
            objective=response.objective,
            provider=response.provider,
            tickers=[allocation.ticker for allocation in response.weights],
            request=payload.model_dump(mode="json"),
            weights={allocation.ticker: allocation.weight for allocation in response.weights},
            metrics=response.metrics.model_dump(),
        )
    except Exception:
        pass

    return response


@router.post("/optimize/explain", response_model=ExplainResponse)
@limiter.limit(HEAVY)
async def explain(
    request: Request,
    payload: OptimizeRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> ExplainResponse:
    check_optimize(
        tickers=payload.tickers,
        objective=payload.objective,
        risk_model=payload.risk_model,
        return_model=payload.return_model,
        lookback_days=payload.lookback_days,
        entitlements=access.entitlements,
    )
    sectors = await sector_provider.resolve(payload.tickers)
    try:
        return await run_explanation(payload, provider, settings, sectors)
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/optimize/history", response_model=list[OptimizationRunSummary])
async def history(
    optimization_repository: OptimizationRepository = Depends(get_optimization_repository),
) -> list[OptimizationRunSummary]:
    runs = await optimization_repository.list_recent()
    return [
        OptimizationRunSummary(
            id=run.id,
            created_at=run.created_at,
            objective=run.objective,
            provider=run.provider,
            tickers=run.tickers,
            metrics=run.metrics,
        )
        for run in runs
    ]


@router.get("/optimize/runs/{run_id}", response_model=OptimizationRunDetail)
async def get_run(
    run_id: int,
    optimization_repository: OptimizationRepository = Depends(get_optimization_repository),
) -> OptimizationRunDetail:
    run = await optimization_repository.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Optimization run not found.")
    return OptimizationRunDetail(
        id=run.id,
        created_at=run.created_at,
        objective=run.objective,
        provider=run.provider,
        tickers=run.tickers,
        metrics=run.metrics,
        request=run.request,
        weights=run.weights,
    )
