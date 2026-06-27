import numpy as np
import pandas as pd

from app.backtest.engine import run_walk_forward
from app.backtest.strategies import equal_weight_strategy, make_optimizer_strategy, static_strategy


def make_prices(n: int = 420, tickers=("AAA", "BBB", "CCC", "SPY", "BND"), seed: int = 0) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    index = pd.bdate_range("2019-01-01", periods=n)
    market = rng.normal(0.0004, 0.01, n)
    data = {}
    for i, ticker in enumerate(tickers):
        beta = 0.6 + 0.2 * i
        daily = 0.0001 + beta * market + rng.normal(0.0, 0.008, n)
        data[ticker] = 100.0 * np.cumprod(1.0 + daily)
    return pd.DataFrame(data, index=index)


def test_engine_returns_equity_curve_and_weights() -> None:
    prices = make_prices()
    path = run_walk_forward(
        prices, equal_weight_strategy(["AAA", "BBB", "CCC"]), lookback=120, rebalance_every=21, cost_bps=10
    )
    assert len(path.equity) == len(path.dates) == len(path.returns) > 0
    assert len(path.rebalance_dates) == len(path.weights) == len(path.turnover)
    assert all(later > earlier for earlier, later in zip(path.dates, path.dates[1:], strict=False))
    assert abs(sum(path.weights[0].values()) - 1.0) < 1e-3
    assert path.total_cost > 0.0


def test_no_look_ahead_windows_end_at_rebalance() -> None:
    prices = make_prices()
    windows: list[tuple] = []

    def spy_only(window: pd.DataFrame):
        windows.append((window.index[0], window.index[-1]))
        return pd.Series(1.0, index=["SPY"])

    run_walk_forward(prices, spy_only, lookback=100, rebalance_every=50, cost_bps=0.0)
    rebalance_positions = list(range(100, len(prices), 50))
    for (_, window_end), position in zip(windows, rebalance_positions, strict=True):
        assert window_end == prices.index[position]


def test_turnover_constraint_reduces_realized_turnover() -> None:
    prices = make_prices(seed=3)
    strategy = make_optimizer_strategy(["AAA", "BBB", "CCC"], "min_variance", "sample", 0.94, 0.0, 1.0, 0.02, 252)
    free = run_walk_forward(prices, strategy, lookback=200, rebalance_every=21, cost_bps=0.0)
    capped = run_walk_forward(prices, strategy, lookback=200, rebalance_every=21, cost_bps=0.0, turnover_budget=0.05)

    avg_free = sum(free.turnover) / len(free.turnover)
    avg_capped = sum(capped.turnover) / len(capped.turnover)
    assert avg_capped <= avg_free + 1e-9
    assert max(capped.turnover[1:], default=0.0) <= 0.05 + 1e-6


def test_static_sixty_forty_runs() -> None:
    prices = make_prices()
    path = run_walk_forward(
        prices, static_strategy({"SPY": 0.6, "BND": 0.4}), lookback=120, rebalance_every=63, cost_bps=5
    )
    assert len(path.equity) > 0
    first = path.weights[0]
    assert abs(first.get("SPY", 0) - 0.6) < 1e-6
    assert abs(first.get("BND", 0) - 0.4) < 1e-6
