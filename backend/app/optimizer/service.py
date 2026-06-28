from datetime import date, timedelta

import numpy as np
import pandas as pd

from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import annualized_mean, build_price_frame, daily_returns
from app.optimizer import markowitz
from app.optimizer.black_litterman import black_litterman
from app.optimizer.constraints import ConstraintError, build_bounds, uniform_bounds
from app.optimizer.risk_models import RiskModel, estimate_covariance
from app.schemas.optimize import (
    FrontierPointSchema,
    FrontierResponse,
    OptimizeRequest,
    OptimizeResponse,
    PortfolioMetrics,
    WeightAllocation,
)


class OptimizationServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _resolve_dates(start: date | None, end: date | None, lookback_days: int | None, settings: Settings) -> tuple[date, date]:
    resolved_end = end or date.today()
    if start:
        resolved_start = start
    else:
        lookback = lookback_days or settings.default_lookback_days
        resolved_start = resolved_end - timedelta(days=lookback)
    if resolved_start >= resolved_end:
        raise OptimizationServiceError("Start date must be before end date.")
    return resolved_start, resolved_end


async def _price_frame(
    tickers: list[str], start: date, end: date, provider: DataProvider, settings: Settings
) -> pd.DataFrame:
    prices = await provider.get_prices(tickers, start, end)
    if len(prices) < 2:
        raise OptimizationServiceError("Not enough of the selected tickers returned data.", 422)
    frame = build_price_frame(prices, settings.min_observations)
    if frame.shape[1] < 2:
        raise OptimizationServiceError("Not enough overlapping price history across the selected tickers.", 422)
    if frame.shape[0] < settings.min_observations:
        raise OptimizationServiceError("Insufficient price history for a reliable estimate.", 422)
    return frame


def _estimate(
    frame: pd.DataFrame, settings: Settings, risk_model: RiskModel, ewma_lambda: float
) -> tuple[np.ndarray, np.ndarray, float | None]:
    returns = daily_returns(frame)
    mu = annualized_mean(returns, settings.trading_days).to_numpy()
    covariance, shrinkage = estimate_covariance(returns, settings.trading_days, risk_model, ewma_lambda)
    return mu, covariance, shrinkage


def _previous_vector(tickers: list[str], prev_weights: dict[str, float] | None) -> np.ndarray:
    n = len(tickers)
    if not prev_weights:
        return np.ones(n) / n
    vector = np.array([float(prev_weights.get(ticker, 0.0)) for ticker in tickers])
    total = vector.sum()
    return vector / total if total > 0 else np.ones(n) / n


def _dispatch(
    request: OptimizeRequest,
    mu: np.ndarray,
    covariance: np.ndarray,
    returns: np.ndarray,
    previous: np.ndarray,
    risk_free_rate: float,
    bounds,
) -> tuple[np.ndarray, str]:
    if request.objective == "min_variance":
        return markowitz.min_variance(mu, covariance, bounds=bounds)
    if request.objective == "max_sharpe":
        return markowitz.max_sharpe(mu, covariance, risk_free_rate=risk_free_rate, bounds=bounds)
    if request.objective == "target_return":
        return markowitz.target_return(mu, covariance, target=request.target_return, bounds=bounds)
    if request.objective == "target_risk":
        return markowitz.target_risk(mu, covariance, target_volatility=request.target_risk, bounds=bounds)
    if request.objective == "risk_parity":
        return markowitz.risk_parity(covariance, bounds=bounds)
    if request.objective == "max_diversification":
        return markowitz.max_diversification(covariance, bounds=bounds)
    if request.objective == "cvar":
        return markowitz.min_cvar(returns, request.cvar_alpha, bounds=bounds)
    return markowitz.cost_aware(
        mu,
        covariance,
        previous,
        request.transaction_cost_bps / 10000.0,
        request.risk_aversion,
        bounds=bounds,
    )


def _allocations(
    tickers: list[str], weights: np.ndarray, sectors: dict[str, str] | None
) -> list[WeightAllocation]:
    resolved = sectors or {}
    pairs = [(ticker, float(weight)) for ticker, weight in zip(tickers, weights, strict=True)]
    pairs.sort(key=lambda item: item[1], reverse=True)
    return [
        WeightAllocation(ticker=ticker, weight=weight, sector=resolved.get(ticker))
        for ticker, weight in pairs
        if abs(weight) > 1e-4
    ]


async def run_optimization(
    request: OptimizeRequest,
    provider: DataProvider,
    settings: Settings,
    sectors: dict[str, str] | None = None,
) -> tuple[OptimizeResponse, pd.DataFrame]:
    start, end = _resolve_dates(request.start, request.end, request.lookback_days, settings)
    frame = await _price_frame(request.tickers, start, end, provider, settings)
    tickers = list(frame.columns)
    returns_frame = daily_returns(frame)
    mu = annualized_mean(returns_frame, settings.trading_days).to_numpy()
    covariance, shrinkage = estimate_covariance(
        returns_frame, settings.trading_days, request.risk_model, request.ewma_lambda
    )
    returns_matrix = returns_frame.to_numpy()
    risk_free_rate = request.risk_free_rate if request.risk_free_rate is not None else settings.risk_free_rate

    if request.return_model == "black_litterman":
        market_weights = np.ones(len(tickers)) / len(tickers)
        mu = black_litterman(covariance, market_weights, request.bl_risk_aversion)

    previous = _previous_vector(tickers, request.prev_weights)

    try:
        bounds = build_bounds(
            tickers,
            request.min_weight,
            request.max_weight,
            request.asset_bounds,
            request.sector_caps,
            sectors,
        )
    except ConstraintError as error:
        raise OptimizationServiceError(str(error), 422) from error

    try:
        weights, status = _dispatch(request, mu, covariance, returns_matrix, previous, risk_free_rate, bounds)
    except markowitz.OptimizationError as error:
        raise OptimizationServiceError(str(error), 422) from error

    turnover = None
    transaction_cost = None
    if request.objective == "cost_aware":
        traded = float(np.abs(weights - previous).sum())
        turnover = traded / 2.0
        transaction_cost = (request.transaction_cost_bps / 10000.0) * traded

    expected, volatility, sharpe = markowitz.portfolio_metrics(weights, mu, covariance, risk_free_rate)
    response = OptimizeResponse(
        objective=request.objective,
        provider=provider.name,
        risk_model=request.risk_model,
        as_of_start=frame.index.min().date(),
        as_of_end=frame.index.max().date(),
        n_assets=len(tickers),
        solver_status=status,
        risk_free_rate=risk_free_rate,
        covariance_shrinkage=shrinkage,
        turnover=turnover,
        transaction_cost=transaction_cost,
        weights=_allocations(tickers, weights, sectors),
        metrics=PortfolioMetrics(
            expected_return=expected,
            volatility=volatility,
            sharpe_ratio=sharpe,
        ),
    )
    return response, frame


async def run_frontier(
    *,
    tickers: list[str],
    lookback_days: int | None,
    min_weight: float,
    max_weight: float,
    risk_model: RiskModel,
    n_points: int,
    risk_free_rate: float | None,
    provider: DataProvider,
    settings: Settings,
    sectors: dict[str, str] | None = None,
) -> FrontierResponse:
    start, end = _resolve_dates(None, None, lookback_days, settings)
    frame = await _price_frame(tickers, start, end, provider, settings)
    columns = list(frame.columns)
    mu, covariance, _ = _estimate(frame, settings, risk_model, 0.94)
    rate = risk_free_rate if risk_free_rate is not None else settings.risk_free_rate
    bounds = uniform_bounds(len(columns), min_weight, max_weight)

    try:
        frontier = markowitz.efficient_frontier(
            mu, covariance, risk_free_rate=rate, n_points=n_points, bounds=bounds
        )
    except markowitz.OptimizationError as error:
        raise OptimizationServiceError(str(error), 422) from error
    if not frontier:
        raise OptimizationServiceError("Could not compute a frontier for the selected inputs.", 422)

    points = [
        FrontierPointSchema(
            expected_return=point.expected_return,
            volatility=point.volatility,
            sharpe_ratio=point.sharpe_ratio,
            weights=_allocations(columns, point.weights, sectors),
        )
        for point in frontier
    ]
    min_variance_index = min(range(len(frontier)), key=lambda i: frontier[i].volatility)
    tangency_index = max(range(len(frontier)), key=lambda i: frontier[i].sharpe_ratio)

    return FrontierResponse(
        provider=provider.name,
        risk_model=risk_model,
        as_of_start=frame.index.min().date(),
        as_of_end=frame.index.max().date(),
        risk_free_rate=rate,
        points=points,
        min_variance_index=min_variance_index,
        tangency_index=tangency_index,
    )
