from datetime import date, timedelta

import numpy as np
import pandas as pd

from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import annualized_covariance, annualized_mean, build_price_frame, daily_returns
from app.optimizer import markowitz
from app.schemas.optimize import (
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


def _resolve_dates(request: OptimizeRequest, settings: Settings) -> tuple[date, date]:
    end = request.end or date.today()
    if request.start:
        start = request.start
    else:
        lookback = request.lookback_days or settings.default_lookback_days
        start = end - timedelta(days=lookback)
    if start >= end:
        raise OptimizationServiceError("Start date must be before end date.")
    return start, end


def _dispatch(
    request: OptimizeRequest, mu: np.ndarray, covariance: np.ndarray, risk_free_rate: float
) -> tuple[np.ndarray, str]:
    w_min, w_max = request.min_weight, request.max_weight
    if request.objective == "min_variance":
        return markowitz.min_variance(mu, covariance, w_min, w_max)
    if request.objective == "max_sharpe":
        return markowitz.max_sharpe(mu, covariance, w_min, w_max, risk_free_rate)
    if request.objective == "target_return":
        return markowitz.target_return(mu, covariance, w_min, w_max, request.target_return)
    return markowitz.target_risk(mu, covariance, w_min, w_max, request.target_risk)


def _allocations(tickers: list[str], weights: np.ndarray) -> list[WeightAllocation]:
    pairs = [(ticker, float(weight)) for ticker, weight in zip(tickers, weights, strict=True)]
    pairs.sort(key=lambda item: item[1], reverse=True)
    return [WeightAllocation(ticker=ticker, weight=weight) for ticker, weight in pairs if abs(weight) > 1e-4]


async def run_optimization(
    request: OptimizeRequest, provider: DataProvider, settings: Settings
) -> tuple[OptimizeResponse, pd.DataFrame]:
    start, end = _resolve_dates(request, settings)
    prices = await provider.get_prices(request.tickers, start, end)
    if len(prices) < 2:
        raise OptimizationServiceError("Not enough of the selected tickers returned data.", 422)

    frame = build_price_frame(prices, settings.min_observations)
    if frame.shape[1] < 2:
        raise OptimizationServiceError("Not enough overlapping price history across the selected tickers.", 422)
    if frame.shape[0] < settings.min_observations:
        raise OptimizationServiceError("Insufficient price history for a reliable estimate.", 422)

    returns = daily_returns(frame)
    mu = annualized_mean(returns, settings.trading_days)
    covariance = annualized_covariance(returns, settings.trading_days)
    tickers = list(frame.columns)
    mu_vector = mu.to_numpy()
    covariance_matrix = covariance.to_numpy()
    risk_free_rate = request.risk_free_rate if request.risk_free_rate is not None else settings.risk_free_rate

    try:
        weights, status = _dispatch(request, mu_vector, covariance_matrix, risk_free_rate)
    except markowitz.OptimizationError as error:
        raise OptimizationServiceError(str(error), 422) from error

    expected, volatility, sharpe = markowitz.portfolio_metrics(weights, mu_vector, covariance_matrix, risk_free_rate)
    response = OptimizeResponse(
        objective=request.objective,
        provider=provider.name,
        as_of_start=frame.index.min().date(),
        as_of_end=frame.index.max().date(),
        n_assets=len(tickers),
        solver_status=status,
        risk_free_rate=risk_free_rate,
        weights=_allocations(tickers, weights),
        metrics=PortfolioMetrics(
            expected_return=expected,
            volatility=volatility,
            sharpe_ratio=sharpe,
        ),
    )
    return response, frame
