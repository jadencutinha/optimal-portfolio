from datetime import date, timedelta

import numpy as np
import pandas as pd

from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import annualized_mean, build_price_frame, daily_returns
from app.optimizer import hrp, markowitz
from app.optimizer.black_litterman import black_litterman
from app.optimizer.constraints import ConstraintError, build_bounds, uniform_bounds
from app.optimizer.risk_models import RiskModel, estimate_covariance
from app.schemas.explain import Counterfactual, ExplainResponse, RiskContribution
from app.schemas.optimize import (
    FrontierPointSchema,
    FrontierResponse,
    OptimizeRequest,
    OptimizeResponse,
    PortfolioMetrics,
    ResampledFrontierResponse,
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
    if request.objective == "hrp":
        return hrp.hierarchical_risk_parity(covariance)
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
    dropped_tickers = [ticker for ticker in request.tickers if ticker not in tickers]
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
        dropped_tickers=dropped_tickers,
    )
    return response, frame


def _contributions(
    tickers: list[str],
    weights: np.ndarray,
    mu: np.ndarray,
    covariance: np.ndarray,
    bounds,
) -> tuple[list[RiskContribution], str | None, list[str]]:
    port_var = float(weights @ covariance @ weights)
    marginal = covariance @ weights
    port_ret = float(weights @ mu)
    rows: list[RiskContribution] = []
    binding: list[str] = []
    top_driver: str | None = None
    top_rc = -1.0
    for i, ticker in enumerate(tickers):
        rc = float(weights[i] * marginal[i] / port_var) if port_var > 1e-18 else 0.0
        rec = float(weights[i] * mu[i] / port_ret) if abs(port_ret) > 1e-9 else 0.0
        at_max = bool(weights[i] >= bounds.upper[i] - 1e-4)
        at_min = bool(bounds.lower[i] > 0 and weights[i] <= bounds.lower[i] + 1e-4)
        if at_max:
            binding.append(ticker)
        if weights[i] > 1e-6 and rc > top_rc:
            top_rc = rc
            top_driver = ticker
        rows.append(
            RiskContribution(
                ticker=ticker,
                weight=float(weights[i]),
                risk_contribution=rc,
                return_contribution=rec,
                at_max_bound=at_max,
                at_min_bound=at_min,
            )
        )
    rows.sort(key=lambda row: row.weight, reverse=True)
    return rows, top_driver, binding


async def run_explanation(
    request: OptimizeRequest,
    provider: DataProvider,
    settings: Settings,
    sectors: dict[str, str] | None = None,
) -> ExplainResponse:
    start, end = _resolve_dates(request.start, request.end, request.lookback_days, settings)
    frame = await _price_frame(request.tickers, start, end, provider, settings)
    tickers = list(frame.columns)
    returns_frame = daily_returns(frame)
    mu = annualized_mean(returns_frame, settings.trading_days).to_numpy()
    covariance, _ = estimate_covariance(
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
            tickers, request.min_weight, request.max_weight, request.asset_bounds, request.sector_caps, sectors
        )
    except ConstraintError as error:
        raise OptimizationServiceError(str(error), 422) from error

    try:
        weights, _ = _dispatch(request, mu, covariance, returns_matrix, previous, risk_free_rate, bounds)
    except markowitz.OptimizationError as error:
        raise OptimizationServiceError(str(error), 422) from error

    expected, volatility, sharpe = markowitz.portfolio_metrics(weights, mu, covariance, risk_free_rate)
    contributions, top_driver, binding = _contributions(tickers, weights, mu, covariance, bounds)
    hhi = float(np.sum(weights**2))
    effective = float(1.0 / hhi) if hhi > 1e-12 else float(len(tickers))

    counterfactuals: list[Counterfactual] = []
    equal = np.ones(len(tickers)) / len(tickers)
    eq_ret, eq_vol, eq_sharpe = markowitz.portfolio_metrics(equal, mu, covariance, risk_free_rate)
    counterfactuals.append(
        Counterfactual(
            label="Equal weight",
            description="Split evenly across every holding instead of optimizing.",
            expected_return=eq_ret,
            volatility=eq_vol,
            sharpe_ratio=eq_sharpe,
            delta_sharpe=eq_sharpe - sharpe,
        )
    )

    if binding and request.max_weight < 1.0:
        new_cap = min(1.0, round(request.max_weight + 0.15, 4))
        relaxed = request.model_copy(update={"max_weight": new_cap})
        try:
            relaxed_bounds = build_bounds(
                tickers, relaxed.min_weight, relaxed.max_weight, relaxed.asset_bounds, relaxed.sector_caps, sectors
            )
            relaxed_weights, _ = _dispatch(
                relaxed, mu, covariance, returns_matrix, previous, risk_free_rate, relaxed_bounds
            )
            r_ret, r_vol, r_sharpe = markowitz.portfolio_metrics(relaxed_weights, mu, covariance, risk_free_rate)
            counterfactuals.append(
                Counterfactual(
                    label=f"Relax cap to {int(new_cap * 100)}%",
                    description=(
                        f"Raise the per-holding cap from {int(request.max_weight * 100)}% "
                        f"to {int(new_cap * 100)}%."
                    ),
                    expected_return=r_ret,
                    volatility=r_vol,
                    sharpe_ratio=r_sharpe,
                    delta_sharpe=r_sharpe - sharpe,
                )
            )
        except (ConstraintError, markowitz.OptimizationError):
            pass

    return ExplainResponse(
        objective=request.objective,
        as_of_start=frame.index.min().date(),
        as_of_end=frame.index.max().date(),
        expected_return=expected,
        volatility=volatility,
        sharpe_ratio=sharpe,
        effective_holdings=effective,
        concentration_hhi=hhi,
        binding_max_weight=bool(binding),
        binding_tickers=binding,
        top_risk_driver=top_driver,
        contributions=contributions,
        counterfactuals=counterfactuals,
    )


def _frontier_weights(
    mu: np.ndarray, covariance: np.ndarray, bounds, n_points: int
) -> list[np.ndarray]:
    floor_weights, _ = markowitz.min_variance(mu, covariance, bounds=bounds)
    ceiling_weights, _ = markowitz.max_return(mu, covariance, bounds=bounds)
    r_lo = float(floor_weights @ mu)
    r_hi = float(ceiling_weights @ mu)
    if r_hi - r_lo <= 1e-9:
        return [floor_weights for _ in range(n_points)]
    targets = np.linspace(r_lo, r_hi, n_points)
    weights_list: list[np.ndarray] = []
    previous = floor_weights
    for target in targets:
        try:
            weights, _ = markowitz.target_return(mu, covariance, target=float(target), bounds=bounds)
            previous = weights
        except markowitz.OptimizationError:
            weights = previous
        weights_list.append(weights)
    return weights_list


def _frontier_point(
    weights: np.ndarray,
    columns: list[str],
    mu: np.ndarray,
    covariance: np.ndarray,
    rate: float,
    sectors: dict[str, str] | None,
) -> FrontierPointSchema:
    expected, volatility, sharpe = markowitz.portfolio_metrics(weights, mu, covariance, rate)
    return FrontierPointSchema(
        expected_return=expected,
        volatility=volatility,
        sharpe_ratio=sharpe,
        weights=_allocations(columns, weights, sectors),
    )


async def run_resampled_frontier(
    *,
    tickers: list[str],
    lookback_days: int | None,
    min_weight: float,
    max_weight: float,
    risk_model: RiskModel,
    n_points: int,
    n_resamples: int,
    risk_free_rate: float | None,
    provider: DataProvider,
    settings: Settings,
    sectors: dict[str, str] | None = None,
) -> ResampledFrontierResponse:
    start, end = _resolve_dates(None, None, lookback_days, settings)
    frame = await _price_frame(tickers, start, end, provider, settings)
    columns = list(frame.columns)
    returns_frame = daily_returns(frame)
    mu = annualized_mean(returns_frame, settings.trading_days).to_numpy()
    covariance, _ = estimate_covariance(returns_frame, settings.trading_days, risk_model, 0.94)
    rate = risk_free_rate if risk_free_rate is not None else settings.risk_free_rate
    bounds = uniform_bounds(len(columns), min_weight, max_weight)

    try:
        base_weights = _frontier_weights(mu, covariance, bounds, n_points)
    except markowitz.OptimizationError as error:
        raise OptimizationServiceError(str(error), 422) from error

    periods = len(returns_frame)
    daily_mu = returns_frame.mean().to_numpy()
    daily_cov = returns_frame.cov().to_numpy()
    rng = np.random.default_rng(7)
    accum = np.zeros((n_points, len(columns)))
    valid = 0
    for _ in range(n_resamples):
        sample = rng.multivariate_normal(daily_mu, daily_cov, size=periods, check_valid="ignore")
        mu_b = sample.mean(axis=0) * settings.trading_days
        cov_b = np.cov(sample, rowvar=False) * settings.trading_days
        try:
            weights_list = _frontier_weights(mu_b, cov_b, bounds, n_points)
        except markowitz.OptimizationError:
            continue
        for i in range(n_points):
            accum[i] += weights_list[i]
        valid += 1

    if valid == 0:
        raise OptimizationServiceError("Could not resample a stable frontier for these inputs.", 422)

    resampled_weights = [accum[i] / valid for i in range(n_points)]
    sample_points = sorted(
        (_frontier_point(w, columns, mu, covariance, rate, sectors) for w in base_weights),
        key=lambda point: point.volatility,
    )
    resampled_points = sorted(
        (_frontier_point(w, columns, mu, covariance, rate, sectors) for w in resampled_weights),
        key=lambda point: point.volatility,
    )

    return ResampledFrontierResponse(
        provider=provider.name,
        risk_model=risk_model,
        as_of_start=frame.index.min().date(),
        as_of_end=frame.index.max().date(),
        risk_free_rate=rate,
        resamples=valid,
        sample=sample_points,
        resampled=resampled_points,
    )


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
