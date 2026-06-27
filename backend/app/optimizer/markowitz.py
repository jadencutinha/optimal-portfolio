from dataclasses import dataclass

import cvxpy as cp
import numpy as np

from app.optimizer.constraints import WeightBounds, uniform_bounds

_OPTIMAL = {"optimal", "optimal_inaccurate"}


class OptimizationError(Exception):
    pass


@dataclass
class FrontierPoint:
    expected_return: float
    volatility: float
    sharpe_ratio: float
    weights: np.ndarray


def _psd(covariance: np.ndarray):
    return cp.psd_wrap(covariance)


def _resolve(n: int, w_min: float, w_max: float, bounds: WeightBounds | None) -> WeightBounds:
    return bounds if bounds is not None else uniform_bounds(n, w_min, w_max)


def _base_constraints(weights: cp.Variable, bounds: WeightBounds, scale=None) -> list:
    total = 1 if scale is None else scale
    constraints = [
        cp.sum(weights) == total,
        weights >= (bounds.lower if scale is None else scale * bounds.lower),
        weights <= (bounds.upper if scale is None else scale * bounds.upper),
    ]
    for group in bounds.groups:
        subset = cp.sum(weights[group.indices])
        if group.max_weight is not None:
            constraints.append(subset <= (group.max_weight if scale is None else scale * group.max_weight))
        if group.min_weight is not None:
            constraints.append(subset >= (group.min_weight if scale is None else scale * group.min_weight))
    return constraints


def _finalize(weights: np.ndarray | None, long_only: bool) -> np.ndarray:
    if weights is None:
        raise OptimizationError("The optimizer did not return a solution.")
    cleaned = np.asarray(weights, dtype=float)
    cleaned[np.abs(cleaned) < 1e-6] = 0.0
    if long_only:
        cleaned = np.clip(cleaned, 0.0, None)
    total = cleaned.sum()
    if not np.isfinite(total) or abs(total) < 1e-8:
        raise OptimizationError("The optimizer produced a degenerate allocation.")
    return cleaned / total


def _check(status: str, label: str) -> None:
    if status not in _OPTIMAL:
        raise OptimizationError(f"Could not find a feasible {label} portfolio with the given constraints.")


def min_variance(
    mu: np.ndarray, covariance: np.ndarray, w_min: float = 0.0, w_max: float = 1.0, *, bounds: WeightBounds | None = None
) -> tuple[np.ndarray, str]:
    n = len(mu)
    resolved = _resolve(n, w_min, w_max, bounds)
    weights = cp.Variable(n)
    problem = cp.Problem(cp.Minimize(cp.quad_form(weights, _psd(covariance))), _base_constraints(weights, resolved))
    problem.solve()
    _check(problem.status, "minimum variance")
    return _finalize(weights.value, resolved.long_only), problem.status


def max_return(
    mu: np.ndarray, covariance: np.ndarray, w_min: float = 0.0, w_max: float = 1.0, *, bounds: WeightBounds | None = None
) -> tuple[np.ndarray, str]:
    n = len(mu)
    resolved = _resolve(n, w_min, w_max, bounds)
    weights = cp.Variable(n)
    problem = cp.Problem(cp.Maximize(mu @ weights), _base_constraints(weights, resolved))
    problem.solve()
    _check(problem.status, "maximum return")
    return _finalize(weights.value, resolved.long_only), problem.status


def target_return(
    mu: np.ndarray,
    covariance: np.ndarray,
    w_min: float = 0.0,
    w_max: float = 1.0,
    target: float | None = None,
    *,
    bounds: WeightBounds | None = None,
) -> tuple[np.ndarray, str]:
    n = len(mu)
    resolved = _resolve(n, w_min, w_max, bounds)
    weights = cp.Variable(n)
    constraints = _base_constraints(weights, resolved) + [mu @ weights >= target]
    problem = cp.Problem(cp.Minimize(cp.quad_form(weights, _psd(covariance))), constraints)
    problem.solve()
    _check(problem.status, "target return")
    return _finalize(weights.value, resolved.long_only), problem.status


def target_risk(
    mu: np.ndarray,
    covariance: np.ndarray,
    w_min: float = 0.0,
    w_max: float = 1.0,
    target_volatility: float | None = None,
    *,
    bounds: WeightBounds | None = None,
) -> tuple[np.ndarray, str]:
    n = len(mu)
    resolved = _resolve(n, w_min, w_max, bounds)
    weights = cp.Variable(n)
    constraints = _base_constraints(weights, resolved) + [
        cp.quad_form(weights, _psd(covariance)) <= target_volatility**2
    ]
    problem = cp.Problem(cp.Maximize(mu @ weights), constraints)
    problem.solve()
    _check(problem.status, "target risk")
    return _finalize(weights.value, resolved.long_only), problem.status


def max_sharpe(
    mu: np.ndarray,
    covariance: np.ndarray,
    w_min: float = 0.0,
    w_max: float = 1.0,
    risk_free_rate: float = 0.0,
    *,
    bounds: WeightBounds | None = None,
) -> tuple[np.ndarray, str]:
    excess = mu - risk_free_rate
    if np.max(excess) <= 0:
        raise OptimizationError("No asset has an expected return above the risk-free rate.")
    n = len(mu)
    resolved = _resolve(n, w_min, w_max, bounds)
    scaled = cp.Variable(n)
    kappa = cp.Variable(nonneg=True)
    constraints = [excess @ scaled == 1] + _base_constraints(scaled, resolved, scale=kappa)
    problem = cp.Problem(cp.Minimize(cp.quad_form(scaled, _psd(covariance))), constraints)
    problem.solve()
    if problem.status not in _OPTIMAL or kappa.value is None or kappa.value <= 1e-10:
        raise OptimizationError("Maximum Sharpe optimization failed to converge.")
    return _finalize(scaled.value / kappa.value, resolved.long_only), problem.status


def max_diversification(
    covariance: np.ndarray, w_min: float = 0.0, w_max: float = 1.0, *, bounds: WeightBounds | None = None
) -> tuple[np.ndarray, str]:
    n = covariance.shape[0]
    resolved = _resolve(n, w_min, w_max, bounds)
    sigma = np.sqrt(np.clip(np.diag(covariance), 1e-12, None))
    scaled = cp.Variable(n)
    kappa = cp.Variable(nonneg=True)
    constraints = [sigma @ scaled == 1] + _base_constraints(scaled, resolved, scale=kappa)
    problem = cp.Problem(cp.Minimize(cp.quad_form(scaled, _psd(covariance))), constraints)
    problem.solve()
    if problem.status not in _OPTIMAL or kappa.value is None or kappa.value <= 1e-10:
        raise OptimizationError("Maximum diversification optimization failed to converge.")
    return _finalize(scaled.value / kappa.value, resolved.long_only), problem.status


def risk_parity(covariance: np.ndarray, *, bounds: WeightBounds | None = None) -> tuple[np.ndarray, str]:
    n = covariance.shape[0]
    weights = cp.Variable(n, nonneg=True)
    objective = 0.5 * cp.quad_form(weights, _psd(covariance)) - cp.sum(cp.log(weights))
    problem = cp.Problem(cp.Minimize(objective))
    problem.solve()
    _check(problem.status, "risk parity")
    if weights.value is None:
        raise OptimizationError("Risk parity optimization failed to converge.")
    return _finalize(weights.value, True), problem.status


def min_cvar(
    returns: np.ndarray,
    alpha: float = 0.95,
    w_min: float = 0.0,
    w_max: float = 1.0,
    *,
    bounds: WeightBounds | None = None,
) -> tuple[np.ndarray, str]:
    periods, n = returns.shape
    resolved = _resolve(n, w_min, w_max, bounds)
    weights = cp.Variable(n)
    value_at_risk = cp.Variable()
    shortfall = cp.Variable(periods, nonneg=True)
    losses = -(returns @ weights)
    constraints = _base_constraints(weights, resolved) + [shortfall >= losses - value_at_risk]
    objective = value_at_risk + (1.0 / ((1.0 - alpha) * periods)) * cp.sum(shortfall)
    problem = cp.Problem(cp.Minimize(objective), constraints)
    problem.solve()
    if problem.status not in _OPTIMAL or weights.value is None:
        raise OptimizationError("CVaR optimization failed to converge.")
    return _finalize(weights.value, resolved.long_only), problem.status


def portfolio_metrics(
    weights: np.ndarray, mu: np.ndarray, covariance: np.ndarray, risk_free_rate: float
) -> tuple[float, float, float]:
    expected = float(weights @ mu)
    variance = float(weights @ covariance @ weights)
    volatility = float(np.sqrt(max(variance, 0.0)))
    sharpe = (expected - risk_free_rate) / volatility if volatility > 0 else 0.0
    return expected, volatility, sharpe


def efficient_frontier(
    mu: np.ndarray,
    covariance: np.ndarray,
    w_min: float = 0.0,
    w_max: float = 1.0,
    risk_free_rate: float = 0.0,
    n_points: int = 25,
    *,
    bounds: WeightBounds | None = None,
) -> list[FrontierPoint]:
    n = len(mu)
    resolved = _resolve(n, w_min, w_max, bounds)
    floor_weights, _ = min_variance(mu, covariance, bounds=resolved)
    ceiling_weights, _ = max_return(mu, covariance, bounds=resolved)
    r_lo = float(floor_weights @ mu)
    r_hi = float(ceiling_weights @ mu)

    if r_hi - r_lo <= 1e-9:
        targets = np.array([r_lo])
    else:
        targets = np.linspace(r_lo, r_hi, max(2, n_points))

    points: list[FrontierPoint] = []
    seen: set[float] = set()
    for target in targets:
        try:
            weights, _ = target_return(mu, covariance, target=float(target), bounds=resolved)
        except OptimizationError:
            continue
        expected, volatility, sharpe = portfolio_metrics(weights, mu, covariance, risk_free_rate)
        key = round(volatility, 6)
        if key in seen:
            continue
        seen.add(key)
        points.append(FrontierPoint(expected, volatility, sharpe, weights))

    points.sort(key=lambda point: point.expected_return)
    return points
