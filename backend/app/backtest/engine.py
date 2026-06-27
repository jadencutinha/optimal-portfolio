from collections.abc import Callable
from dataclasses import dataclass
from datetime import date

import pandas as pd

WeightFn = Callable[[pd.DataFrame], "pd.Series | None"]


class BacktestError(Exception):
    pass


@dataclass
class BacktestPath:
    dates: list[date]
    equity: list[float]
    returns: list[float]
    drawdown: list[float]
    rebalance_dates: list[date]
    weights: list[dict]
    turnover: list[float]
    total_cost: float


def _apply_turnover_cap(prev: pd.Series, target: pd.Series, budget: float) -> pd.Series:
    delta = target - prev
    turnover = 0.5 * float(delta.abs().sum())
    if turnover <= budget or turnover == 0.0:
        return target
    return prev + (budget / turnover) * delta


def _apply_no_trade_band(prev: pd.Series, target: pd.Series, band: float) -> pd.Series:
    adjusted = target.copy()
    held = (target - prev).abs() < band
    adjusted[held] = prev[held]
    total = adjusted.sum()
    return adjusted / total if total > 0 else target


def run_walk_forward(
    prices: pd.DataFrame,
    weight_fn: WeightFn,
    *,
    lookback: int,
    rebalance_every: int,
    cost_bps: float = 0.0,
    turnover_budget: float | None = None,
    no_trade_band: float = 0.0,
) -> BacktestPath:
    columns = list(prices.columns)
    returns = prices.pct_change()
    index = list(prices.index)
    n = len(index)
    if n <= lookback + 1:
        raise BacktestError("Not enough price history for the chosen estimation window.")

    rebalance_positions = set(range(lookback, n, rebalance_every))
    weights = pd.Series(0.0, index=columns)
    invested = False
    equity = 1.0
    peak = 1.0
    total_cost = 0.0

    out_dates: list[date] = []
    equity_curve: list[float] = []
    period_returns: list[float] = []
    drawdowns: list[float] = []
    rebalance_dates: list[date] = []
    rebalance_weights: list[dict] = []
    turnovers: list[float] = []

    for i in range(lookback, n):
        day_return = 0.0
        if invested:
            day_simple = returns.iloc[i].reindex(columns).fillna(0.0)
            day_return = float((weights * day_simple).sum())
            grown = weights * (1.0 + day_simple)
            total = grown.sum()
            if total > 0:
                weights = grown / total

        if i in rebalance_positions:
            window = prices.iloc[i - lookback + 1 : i + 1]
            target = weight_fn(window)
            if target is not None:
                target = target.reindex(columns).fillna(0.0)
                total = target.sum()
                if total > 0:
                    target = target / total
                    previous = weights.copy() if invested else pd.Series(0.0, index=columns)
                    if no_trade_band > 0.0 and invested:
                        target = _apply_no_trade_band(previous, target, no_trade_band)
                    if turnover_budget is not None and invested:
                        target = _apply_turnover_cap(previous, target, turnover_budget)
                    traded = float((target - previous).abs().sum())
                    cost = (cost_bps / 10000.0) * traded
                    day_return -= cost
                    total_cost += cost
                    weights = target
                    invested = True
                    rebalance_dates.append(index[i].date())
                    rebalance_weights.append(
                        {ticker: round(float(weight), 6) for ticker, weight in target.items() if abs(weight) > 1e-6}
                    )
                    turnovers.append(traded / 2.0)

        if invested:
            equity *= 1.0 + day_return
            peak = max(peak, equity)
            out_dates.append(index[i].date())
            equity_curve.append(equity)
            period_returns.append(day_return)
            drawdowns.append(equity / peak - 1.0)

    if not equity_curve:
        raise BacktestError("The backtest produced no investable periods.")

    return BacktestPath(
        dates=out_dates,
        equity=equity_curve,
        returns=period_returns,
        drawdown=drawdowns,
        rebalance_dates=rebalance_dates,
        weights=rebalance_weights,
        turnover=turnovers,
        total_cost=total_cost,
    )
