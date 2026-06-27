import numpy as np
import pandas as pd

from app.backtest.analytics import performance_stats, relative_stats, rolling_sharpe


def _index(n: int) -> pd.DatetimeIndex:
    return pd.bdate_range("2020-01-01", periods=n)


def test_constant_positive_return_metrics() -> None:
    returns = pd.Series([0.001] * 252, index=_index(252))
    stats = performance_stats(returns, 252, 0.0)
    expected_total = 1.001**252 - 1
    assert abs(stats.total_return - expected_total) < 1e-9
    assert abs(stats.cagr - expected_total) < 1e-6
    assert stats.annual_volatility < 1e-9
    assert stats.max_drawdown == 0.0


def test_known_drawdown_and_total_return() -> None:
    returns = pd.Series([0.5, -0.5], index=_index(2))
    stats = performance_stats(returns, 252, 0.0)
    assert abs(stats.max_drawdown - (-0.5)) < 1e-9
    assert abs(stats.total_return - (-0.25)) < 1e-9


def test_relative_beta_and_alpha_recovered() -> None:
    rng = np.random.default_rng(0)
    benchmark = pd.Series(rng.normal(0.0005, 0.01, 300), index=_index(300))
    returns = 2.0 * benchmark
    relative = relative_stats(returns, benchmark, 252, 0.0)
    assert abs(relative.beta - 2.0) < 1e-6
    assert abs(relative.alpha) < 1e-6
    assert relative.tracking_error >= 0.0


def test_rolling_sharpe_length() -> None:
    rng = np.random.default_rng(1)
    returns = pd.Series(rng.normal(0.0005, 0.01, 200), index=_index(200))
    series = rolling_sharpe(returns, 63, 252, 0.02)
    assert len(series) == 200 - 63 + 1
