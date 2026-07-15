from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import get_access, get_backtest_repository, get_provider, get_settings
from app.auth.gating import Access, require_pro
from app.backtest.repository import BacktestRepository
from app.backtest.service import BacktestServiceError, run_backtest
from app.config import Settings
from app.data.provider import DataProvider
from app.ratelimit import HEAVY, limiter
from app.schemas.backtest import BacktestRequest, BacktestResponse

router = APIRouter(tags=["backtest"])


@router.post("/backtest", response_model=BacktestResponse)
@limiter.limit(HEAVY)
async def backtest(
    request: Request,
    payload: BacktestRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    access: Access = Depends(get_access),
    repository: BacktestRepository = Depends(get_backtest_repository),
) -> BacktestResponse:
    require_pro(access.entitlements, "Backtesting")
    try:
        response = await run_backtest(payload, provider, settings)
    except BacktestServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    try:
        response.run_id = await repository.save(
            tickers=payload.tickers,
            config=payload.model_dump(mode="json"),
            result=response.model_dump(mode="json"),
        )
    except Exception:
        pass

    return response


@router.get("/backtest/runs/{run_id}", response_model=BacktestResponse)
async def get_backtest(
    run_id: int,
    repository: BacktestRepository = Depends(get_backtest_repository),
) -> BacktestResponse:
    run = await repository.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Backtest run not found.")
    data = dict(run.result)
    data["run_id"] = run.id
    return BacktestResponse(**data)
