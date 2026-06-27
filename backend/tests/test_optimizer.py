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


def test_min_variance_is_fully_invested_and_long_only() -> None:
    mu, covariance = make_problem()
    weights, status = markowitz.min_variance(mu, covariance, 0.0, 1.0)
    assert status in markowitz._OPTIMAL
    assert abs(weights.sum() - 1.0) < 1e-6
    assert (weights >= -1e-6).all()


def test_min_variance_not_worse_than_equal_weight() -> None:
    mu, covariance = make_problem()
    weights, _ = markowitz.min_variance(mu, covariance, 0.0, 1.0)
    equal_weight = np.ones(len(mu)) / len(mu)
    assert weights @ covariance @ weights <= equal_weight @ covariance @ equal_weight + 1e-8


def test_target_return_meets_constraint() -> None:
    mu, covariance = make_problem()
    weights, _ = markowitz.target_return(mu, covariance, 0.0, 1.0, 0.12)
    assert weights @ mu >= 0.12 - 1e-4


def test_target_risk_respects_volatility_budget() -> None:
    mu, covariance = make_problem()
    weights, _ = markowitz.target_risk(mu, covariance, 0.0, 1.0, 0.15)
    volatility = np.sqrt(weights @ covariance @ weights)
    assert volatility <= 0.15 + 1e-3


def test_max_sharpe_dominates_min_variance_sharpe() -> None:
    mu, covariance = make_problem()
    sharpe_weights, _ = markowitz.max_sharpe(mu, covariance, 0.0, 1.0, 0.02)
    variance_weights, _ = markowitz.min_variance(mu, covariance, 0.0, 1.0)
    sharpe = (sharpe_weights @ mu - 0.02) / np.sqrt(sharpe_weights @ covariance @ sharpe_weights)
    baseline = (variance_weights @ mu - 0.02) / np.sqrt(variance_weights @ covariance @ variance_weights)
    assert sharpe >= baseline - 1e-6


def test_max_weight_bound_enforced() -> None:
    mu, covariance = make_problem()
    weights, _ = markowitz.min_variance(mu, covariance, 0.0, 0.5)
    assert (weights <= 0.5 + 1e-6).all()


def test_risk_parity_equalizes_risk_contributions() -> None:
    _, covariance = make_problem()
    weights, status = markowitz.risk_parity(covariance)
    assert status in markowitz._OPTIMAL
    assert abs(weights.sum() - 1.0) < 1e-6
    assert (weights >= -1e-9).all()
    contributions = weights * (covariance @ weights)
    assert contributions.std() / contributions.mean() < 0.2


def test_max_diversification_beats_equal_weight() -> None:
    _, covariance = make_problem()
    weights, _ = markowitz.max_diversification(covariance)
    sigma = np.sqrt(np.diag(covariance))
    equal_weight = np.ones(len(sigma)) / len(sigma)

    def diversification_ratio(w: np.ndarray) -> float:
        return (w @ sigma) / np.sqrt(w @ covariance @ w)

    assert diversification_ratio(weights) >= diversification_ratio(equal_weight) - 1e-6
    assert abs(weights.sum() - 1.0) < 1e-6


def test_min_cvar_is_fully_invested_and_long_only() -> None:
    rng = np.random.default_rng(0)
    returns = rng.normal(0.0005, 0.01, (300, 4))
    weights, status = markowitz.min_cvar(returns, 0.95)
    assert status in markowitz._OPTIMAL
    assert abs(weights.sum() - 1.0) < 1e-6
    assert (weights >= -1e-9).all()
