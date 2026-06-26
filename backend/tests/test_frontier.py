import numpy as np

from app.optimizer import markowitz


def make_problem() -> tuple[np.ndarray, np.ndarray]:
    mu = np.array([0.08, 0.12, 0.15])
    volatilities = np.array([0.10, 0.18, 0.25])
    correlation = np.array(
        [
            [1.0, 0.2, 0.1],
            [0.2, 1.0, 0.3],
            [0.1, 0.3, 1.0],
        ]
    )
    covariance = np.outer(volatilities, volatilities) * correlation
    return mu, covariance


def test_frontier_is_monotonic_and_convex() -> None:
    mu, covariance = make_problem()
    points = markowitz.efficient_frontier(mu, covariance, 0.0, 1.0, risk_free_rate=0.02, n_points=15)
    assert len(points) >= 3
    returns = [point.expected_return for point in points]
    volatilities = [point.volatility for point in points]
    assert all(returns[i] <= returns[i + 1] + 1e-9 for i in range(len(returns) - 1))
    assert all(volatilities[i] <= volatilities[i + 1] + 1e-6 for i in range(len(volatilities) - 1))
    variances = [vol**2 for vol in volatilities]
    for i in range(1, len(variances) - 1):
        assert variances[i + 1] - 2 * variances[i] + variances[i - 1] >= -1e-5


def test_frontier_endpoints_match_special_portfolios() -> None:
    mu, covariance = make_problem()
    points = markowitz.efficient_frontier(mu, covariance, 0.0, 1.0, risk_free_rate=0.02, n_points=20)
    min_var_weights, _ = markowitz.min_variance(mu, covariance, 0.0, 1.0)
    min_var_vol = float(np.sqrt(min_var_weights @ covariance @ min_var_weights))
    assert abs(points[0].volatility - min_var_vol) < 1e-3

    sharpe_weights, _ = markowitz.max_sharpe(mu, covariance, 0.0, 1.0, 0.02)
    best_sharpe = (sharpe_weights @ mu - 0.02) / np.sqrt(sharpe_weights @ covariance @ sharpe_weights)
    frontier_best = max(point.sharpe_ratio for point in points)
    assert frontier_best <= best_sharpe + 1e-6
    assert frontier_best >= best_sharpe - 0.05
