from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_access, get_provider, get_sector_provider, get_settings
from app.auth.gating import Access, check_optimize
from app.backtest.stress import run_stress
from app.config import Settings
from app.data.provider import DataProvider
from app.data.sectors import SectorProvider
from app.optimizer.service import OptimizationServiceError, run_optimization
from app.schemas.optimize import OptimizeRequest
from app.schemas.stress import StressCurvePoint, StressResponse, StressWindowSchema

router = APIRouter(tags=["stress"])


@router.post("/stress", response_model=StressResponse)
async def stress(
    request: OptimizeRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> StressResponse:
    check_optimize(
        tickers=request.tickers,
        objective=request.objective,
        risk_model=request.risk_model,
        return_model=request.return_model,
        lookback_days=request.lookback_days,
        entitlements=access.entitlements,
    )
    sectors = await sector_provider.resolve(request.tickers)
    try:
        response, _ = await run_optimization(request, provider, settings, sectors)
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    weights = {allocation.ticker: allocation.weight for allocation in response.weights}
    windows = await run_stress(weights, provider, settings)

    return StressResponse(
        objective=response.objective,
        provider=response.provider,
        weights=response.weights,
        windows=[
            StressWindowSchema(
                key=window.key,
                label=window.label,
                description=window.description,
                start=window.start,
                end=window.end,
                available=window.available,
                total_return=window.total_return,
                max_drawdown=window.max_drawdown,
                volatility=window.volatility,
                recovered=window.recovered,
                recovery_days=window.recovery_days,
                trough_date=window.trough_date,
                assets_used=window.assets_used,
                missing_tickers=window.missing_tickers,
                curve=[StressCurvePoint(date=point["date"], equity=point["equity"]) for point in window.curve],
            )
            for window in windows
        ],
    )
