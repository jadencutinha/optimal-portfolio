import numpy as np
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_access, get_provider, get_sector_provider, get_settings
from app.auth.gating import Access, check_optimize
from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import daily_returns
from app.data.sectors import SectorProvider
from app.factors.decomposition import decompose
from app.optimizer.service import OptimizationServiceError, run_optimization
from app.schemas.factors import FactorExposureSchema, FactorResponse
from app.schemas.optimize import OptimizeRequest

router = APIRouter(tags=["factors"])


@router.post("/factors", response_model=FactorResponse)
async def factors(
    request: OptimizeRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> FactorResponse:
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
        response, frame = await run_optimization(request, provider, settings, sectors)
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    returns_frame = daily_returns(frame)
    weight_map = {allocation.ticker: allocation.weight for allocation in response.weights}
    weights = np.array([weight_map.get(ticker, 0.0) for ticker in frame.columns])

    result = decompose(returns_frame, weights, response.risk_free_rate, settings.trading_days)

    return FactorResponse(
        objective=response.objective,
        weights=response.weights,
        exposures=[
            FactorExposureSchema(
                key=exposure.key,
                label=exposure.label,
                beta=exposure.beta,
                t_stat=exposure.t_stat,
                factor_return=exposure.factor_return,
                contribution=exposure.contribution,
            )
            for exposure in result.exposures
        ],
        alpha=result.alpha,
        r_squared=result.r_squared,
        idiosyncratic_vol=result.idiosyncratic_vol,
        observations=result.observations,
        note=result.note,
    )
