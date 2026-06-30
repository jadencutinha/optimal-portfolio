import numpy as np

from app.optimizer import markowitz
from app.optimizer.black_litterman import black_litterman, equilibrium_returns


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


def test_cost_aware_higher_cost_reduces_turnover() -> None:
    mu, covariance = make_problem()
    previous = np.array([1.0, 0.0, 0.0])
    low, _ = markowitz.cost_aware(mu, covariance, previous, cost=0.0, risk_aversion=5.0)
    high, _ = markowitz.cost_aware(mu, covariance, previous, cost=0.5, risk_aversion=5.0)
    assert np.abs(high - previous).sum() <= np.abs(low - previous).sum() + 1e-6
    assert abs(high.sum() - 1.0) < 1e-6


def test_black_litterman_returns_equilibrium_without_views() -> None:
    _, covariance = make_problem()
    market_weights = np.ones(3) / 3
    prior = equilibrium_returns(covariance, market_weights, 2.5)
    posterior = black_litterman(covariance, market_weights, 2.5)
    assert np.allclose(posterior, prior)


def test_black_litterman_is_less_concentrated_than_sample_mvo() -> None:
    mu, covariance = make_problem()
    market_weights = np.ones(3) / 3
    bl_mu = black_litterman(covariance, market_weights, 2.5)
    sample_weights, _ = markowitz.max_sharpe(mu, covariance, 0.0, 1.0, 0.0)
    bl_weights, _ = markowitz.max_sharpe(bl_mu, covariance, 0.0, 1.0, 0.0)
    herfindahl = lambda w: float((w**2).sum())  # noqa: E731
    assert herfindahl(bl_weights) <= herfindahl(sample_weights) + 1e-6
