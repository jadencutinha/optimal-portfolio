import asyncio

from app.config import Settings
from app.data.provider import DataProvider
from app.jobs.manager import ReportFn
from app.optimizer.service import OptimizationServiceError, run_optimization
from app.schemas.jobs import SweepRequest
from app.schemas.optimize import OptimizeRequest


async def run_sweep(
    request: SweepRequest, provider: DataProvider, settings: Settings, report: ReportFn
) -> dict:
    cells: list[dict] = []
    completed = 0

    for objective in request.objectives:
        for risk_model in request.risk_models:
            cell: dict = {"objective": objective, "risk_model": risk_model}
            try:
                optimize_request = OptimizeRequest(
                    tickers=request.tickers,
                    objective=objective,
                    risk_model=risk_model,
                    return_model="historical",
                    lookback_days=request.lookback_days,
                    min_weight=0.0,
                    max_weight=request.max_weight,
                )
                response, _ = await run_optimization(optimize_request, provider, settings)
                cell.update(
                    status="ok",
                    expected_return=response.metrics.expected_return,
                    volatility=response.metrics.volatility,
                    sharpe_ratio=response.metrics.sharpe_ratio,
                )
            except OptimizationServiceError as error:
                cell.update(status="error", message=error.message, expected_return=None, volatility=None, sharpe_ratio=None)

            cells.append(cell)
            completed += 1
            await report({"completed": completed, "cell": cell})
            await asyncio.sleep(0)

    return {"cells": cells, "objectives": request.objectives, "risk_models": request.risk_models}
