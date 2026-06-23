import cvxpy as cp
import numpy as np

_OPTIMAL = {"optimal", "optimal_inaccurate"}


class OptimizationError(Exception):
    pass


def _psd(covariance: np.ndarray):
    return cp.psd_wrap(covariance)


def _finalize(weights: np.ndarray | None, w_min: float) -> np.ndarray:
    if weights is None:
        raise OptimizationError("The optimizer did not return a solution.")
    cleaned = np.asarray(weights, dtype=float)
    cleaned[np.abs(cleaned) < 1e-6] = 0.0
    if w_min >= 0:
        cleaned = np.clip(cleaned, 0.0, None)
    total = cleaned.sum()
    if not np.isfinite(total) or abs(total) < 1e-8:
        raise OptimizationError("The optimizer produced a degenerate allocation.")
    return cleaned / total


def _check(status: str, label: str) -> None:
    if status not in _OPTIMAL:
        raise OptimizationError(f"Could not find a feasible {label} portfolio with the given constraints.")


def min_variance(mu: np.ndarray, covariance: np.ndarray, w_min: float, w_max: float) -> tuple[np.ndarray, str]:
    n = len(mu)
    weights = cp.Variable(n)
    constraints = [cp.sum(weights) == 1, weights >= w_min, weights <= w_max]
    problem = cp.Problem(cp.Minimize(cp.quad_form(weights, _psd(covariance))), constraints)
    problem.solve()
    _check(problem.status, "minimum variance")
    return _finalize(weights.value, w_min), problem.status


def target_return(
    mu: np.ndarray, covariance: np.ndarray, w_min: float, w_max: float, target: float
) -> tuple[np.ndarray, str]:
    n = len(mu)
    weights = cp.Variable(n)
    constraints = [cp.sum(weights) == 1, weights >= w_min, weights <= w_max, mu @ weights >= target]
    problem = cp.Problem(cp.Minimize(cp.quad_form(weights, _psd(covariance))), constraints)
    problem.solve()
    _check(problem.status, "target return")
    return _finalize(weights.value, w_min), problem.status


def target_risk(
    mu: np.ndarray, covariance: np.ndarray, w_min: float, w_max: float, target_volatility: float
) -> tuple[np.ndarray, str]:
    n = len(mu)
    weights = cp.Variable(n)
    variance_budget = target_volatility**2
    constraints = [
        cp.sum(weights) == 1,
        weights >= w_min,
        weights <= w_max,
        cp.quad_form(weights, _psd(covariance)) <= variance_budget,
    ]
    problem = cp.Problem(cp.Maximize(mu @ weights), constraints)
    problem.solve()
    _check(problem.status, "target risk")
    return _finalize(weights.value, w_min), problem.status


def max_sharpe(
    mu: np.ndarray, covariance: np.ndarray, w_min: float, w_max: float, risk_free_rate: float
) -> tuple[np.ndarray, str]:
    excess = mu - risk_free_rate
    if np.max(excess) <= 0:
        raise OptimizationError("No asset has an expected return above the risk-free rate.")
    n = len(mu)
    scaled = cp.Variable(n)
    kappa = cp.Variable(nonneg=True)
    constraints = [
        excess @ scaled == 1,
        cp.sum(scaled) == kappa,
        scaled >= w_min * kappa,
        scaled <= w_max * kappa,
    ]
    problem = cp.Problem(cp.Minimize(cp.quad_form(scaled, _psd(covariance))), constraints)
    problem.solve()
    if problem.status not in _OPTIMAL or kappa.value is None or kappa.value <= 1e-10:
        raise OptimizationError("Maximum Sharpe optimization failed to converge.")
    return _finalize(scaled.value / kappa.value, w_min), problem.status


def portfolio_metrics(
    weights: np.ndarray, mu: np.ndarray, covariance: np.ndarray, risk_free_rate: float
) -> tuple[float, float, float]:
    expected = float(weights @ mu)
    variance = float(weights @ covariance @ weights)
    volatility = float(np.sqrt(max(variance, 0.0)))
    sharpe = (expected - risk_free_rate) / volatility if volatility > 0 else 0.0
    return expected, volatility, sharpe
