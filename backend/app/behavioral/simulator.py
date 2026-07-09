from dataclasses import dataclass, field
from datetime import date

import numpy as np
import pandas as pd

from app.backtest.engine import WeightFn


class BehavioralError(Exception):
    def __init__(self, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class BehaviorPolicy:
    rebalance_every: int
    panic_drawdown: float | None = None
    panic_sell_fraction: float = 0.0
    reenter_after_days: int = 0
    disposition: bool = False
    realize_gain_threshold: float = 0.25
    realize_fraction: float = 0.5


@dataclass
class PolicyPath:
    dates: list[date] = field(default_factory=list)
    equity: list[float] = field(default_factory=list)
    returns: list[float] = field(default_factory=list)
    drawdown: list[float] = field(default_factory=list)
    panic_dates: list[date] = field(default_factory=list)
    rebalance_count: int = 0
    total_cost: float = 0.0
    total_turnover: float = 0.0
    days_derisked: int = 0


def _apply_disposition(
    weights: pd.Series,
    basis: pd.Series,
    prices_now: pd.Series,
    target: pd.Series,
    gain_threshold: float,
    realize_fraction: float,
) -> pd.Series:
    known = basis.notna() & prices_now.notna()
    forced = pd.Series(False, index=weights.index)

    losers = known & (prices_now < basis) & (target < weights)
    target[losers] = weights[losers]
    forced |= losers

    winners = known & (prices_now >= basis * (1.0 + gain_threshold)) & (weights > 0)
    trimmed = weights * (1.0 - realize_fraction)
    realize = winners & (target > trimmed)
    target[realize] = trimmed[realize]
    forced |= realize

    if not bool(forced.any()):
        return target

    locked = float(target[forced].sum())
    free = float(target[~forced].sum())
    remaining = 1.0 - locked
    if remaining > 0 and free > 0:
        target[~forced] = target[~forced] * (remaining / free)
        return target

    total = float(target.sum())
    return target / total if total > 0 else weights.copy()


def _rebalance(
    weights: pd.Series,
    basis: pd.Series,
    prices_now: pd.Series,
    target: pd.Series,
    *,
    policy: "BehaviorPolicy | None",
    invested: bool,
) -> tuple[pd.Series, pd.Series, float]:
    target = target.reindex(weights.index).fillna(0.0)
    total = float(target.sum())
    if total <= 0:
        return weights, basis, 0.0
    target = target / total

    if policy is not None and policy.disposition and invested:
        target = _apply_disposition(
            weights, basis, prices_now, target, policy.realize_gain_threshold, policy.realize_fraction
        )

    traded = float((target - weights).abs().sum())

    buying = target > weights
    new_basis = basis.copy()
    for ticker in weights.index[buying]:
        previous = float(weights[ticker])
        added = float(target[ticker]) - previous
        price = float(prices_now[ticker])
        old = basis[ticker]
        if previous <= 0 or not np.isfinite(old):
            new_basis[ticker] = price
        else:
            new_basis[ticker] = (previous * float(old) + added * price) / (previous + added)
    new_basis[target <= 0] = np.nan

    return target, new_basis, traded


def simulate(
    prices: pd.DataFrame,
    weight_fn: WeightFn,
    policy: BehaviorPolicy,
    *,
    lookback: int,
    cost_bps: float,
    risk_free_rate: float,
    trading_days: int,
) -> PolicyPath:
    columns = list(prices.columns)
    returns = prices.pct_change()
    index = list(prices.index)
    n = len(index)
    if n <= lookback + 1:
        raise BehavioralError("Not enough price history for the chosen estimation window.")

    rebalance_positions = set(range(lookback, n, policy.rebalance_every))
    daily_rf = risk_free_rate / trading_days

    weights = pd.Series(0.0, index=columns)
    basis = pd.Series(np.nan, index=columns)
    cash = 1.0
    invested = False
    equity = 1.0
    peak = 1.0
    cooldown = 0

    path = PolicyPath()

    for i in range(lookback, n):
        day_return = 0.0
        if invested:
            day_simple = returns.iloc[i].reindex(columns).fillna(0.0)
            day_return = float((weights * day_simple).sum()) + cash * daily_rf
            grown = weights * (1.0 + day_simple)
            grown_cash = cash * (1.0 + daily_rf)
            total = float(grown.sum()) + grown_cash
            if total > 0:
                weights = grown / total
                cash = grown_cash / total
            equity *= 1.0 + day_return

        prices_now = prices.iloc[i].reindex(columns)

        drawdown = equity / peak - 1.0

        if cooldown > 0:
            path.days_derisked += 1
            cooldown -= 1
            if cooldown == 0:
                window = prices.iloc[i - lookback + 1 : i + 1]
                target = weight_fn(window)
                if target is not None:
                    weights, basis, traded = _rebalance(
                        weights, basis, prices_now, target, policy=None, invested=invested
                    )
                    cost = (cost_bps / 10000.0) * traded
                    equity *= 1.0 - cost
                    day_return -= cost
                    path.total_cost += cost
                    path.total_turnover += traded / 2.0
                    path.rebalance_count += 1
                    cash = 0.0
        elif (
            invested
            and policy.panic_drawdown is not None
            and policy.panic_sell_fraction > 0.0
            and cash < 0.999
            and drawdown <= -policy.panic_drawdown
        ):
            fraction = policy.panic_sell_fraction
            traded = fraction * float(weights.sum())
            cost = (cost_bps / 10000.0) * traded
            equity *= 1.0 - cost
            day_return -= cost
            path.total_cost += cost
            path.total_turnover += traded / 2.0
            weights = weights * (1.0 - fraction)
            cash = 1.0 - float(weights.sum())
            path.panic_dates.append(index[i].date())
            cooldown = max(policy.reenter_after_days, 1)
        elif i in rebalance_positions:
            window = prices.iloc[i - lookback + 1 : i + 1]
            target = weight_fn(window)
            if target is not None:
                weights, basis, traded = _rebalance(
                    weights, basis, prices_now, target, policy=policy, invested=invested
                )
                cost = (cost_bps / 10000.0) * traded
                equity *= 1.0 - cost
                day_return -= cost
                path.total_cost += cost
                path.total_turnover += traded / 2.0
                path.rebalance_count += 1
                cash = 0.0
                invested = True

        if invested:
            peak = max(peak, equity)
            path.dates.append(index[i].date())
            path.equity.append(equity)
            path.returns.append(day_return)
            path.drawdown.append(equity / peak - 1.0)

    if not path.equity:
        raise BehavioralError("The simulation produced no investable periods.")

    return path
