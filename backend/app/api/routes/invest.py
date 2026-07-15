from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user, get_invest_simulator, get_portfolio_repository, get_provider
from app.auth.repository import ProfileData
from app.data.provider import DataProvider
from app.invest.client import InvestError
from app.invest.simulator import InvestSimulator
from app.portfolios.repository import PortfolioRepository
from app.schemas.invest import (
    AccountSummary,
    BenchmarkSeries,
    InvestRequest,
    InvestSummary,
    OrderRecord,
    OrderResult,
    PortfolioHistory,
    Position,
    RebalancePlan,
    RebalanceRequest,
    RebalanceSummary,
    TradeRequest,
)

router = APIRouter(tags=["invest"])


@router.get("/invest/account", response_model=AccountSummary)
async def account(
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> AccountSummary:
    try:
        return await simulator.account(user)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invest/positions", response_model=list[Position])
async def positions(
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> list[Position]:
    try:
        return await simulator.positions(user)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invest/orders", response_model=list[OrderRecord])
async def orders(
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> list[OrderRecord]:
    try:
        return await simulator.orders(user)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invest/history", response_model=PortfolioHistory)
async def history(
    window: str = Query("1M", alias="range"),
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> PortfolioHistory:
    try:
        return await simulator.history(user, window)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invest/benchmark", response_model=BenchmarkSeries)
async def benchmark(
    window: str = Query("3M", alias="range"),
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
    provider: DataProvider = Depends(get_provider),
) -> BenchmarkSeries:
    try:
        return await simulator.benchmark(user, window, provider)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/invest/orders", response_model=InvestSummary)
async def invest(
    body: InvestRequest,
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> InvestSummary:
    try:
        return await simulator.invest(user, body.weights, body.amount)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invest/rebalance", response_model=RebalancePlan)
async def rebalance_preview(
    portfolio_id: int = Query(..., alias="portfolio_id"),
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
    portfolios: PortfolioRepository = Depends(get_portfolio_repository),
) -> RebalancePlan:
    saved = await portfolios.get(user.id, portfolio_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="That portfolio does not exist.")
    try:
        return await simulator.rebalance_plan(user, saved)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/invest/rebalance", response_model=RebalanceSummary)
async def rebalance(
    body: RebalanceRequest,
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
    portfolios: PortfolioRepository = Depends(get_portfolio_repository),
) -> RebalanceSummary:
    saved = await portfolios.get(user.id, body.portfolio_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="That portfolio does not exist.")
    try:
        return await simulator.rebalance(user, saved)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/invest/trade", response_model=OrderResult)
async def trade(
    body: TradeRequest,
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> OrderResult:
    try:
        return await simulator.trade(user, body.symbol, body.side, body.notional)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.delete("/invest/positions/{symbol}", response_model=OrderResult)
async def close_position(
    symbol: str,
    percentage: float | None = Query(None, gt=0, le=100),
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> OrderResult:
    try:
        return await simulator.close_position(user, symbol, percentage)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.delete("/invest/positions")
async def reset(
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> dict[str, int]:
    return {"closed": await simulator.reset(user)}


@router.delete("/invest/orders")
async def cancel_orders(
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> dict[str, int]:
    return {"canceled": await simulator.cancel_all(user)}


@router.delete("/invest/orders/{order_id}")
async def cancel_order(
    order_id: str,
    user: ProfileData = Depends(get_current_user),
    simulator: InvestSimulator = Depends(get_invest_simulator),
) -> dict[str, bool]:
    return {"canceled": await simulator.cancel_one(user, order_id)}
