from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class PerformanceStats:
    total_return: float
    cagr: float
    annual_volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    calmar_ratio: float


@dataclass
class RelativeStats:
    alpha: float
    beta: float
    tracking_error: float
    information_ratio: float


def performance_stats(returns: pd.Series, trading_days: int, risk_free_rate: float) -> PerformanceStats:
    series = returns.dropna()
    if series.empty:
        return PerformanceStats(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

    growth = float((1.0 + series).prod())
    total_return = growth - 1.0
    years = len(series) / trading_days
    cagr = float(growth ** (1.0 / years) - 1.0) if years > 0 and growth > 0 else 0.0

    volatility = float(series.std(ddof=0) * np.sqrt(trading_days))
    annual_return = float(series.mean() * trading_days)
    sharpe = (annual_return - risk_free_rate) / volatility if volatility > 0 else 0.0

    downside = series[series < 0]
    downside_vol = float(downside.std(ddof=0) * np.sqrt(trading_days)) if len(downside) > 1 else 0.0
    sortino = (annual_return - risk_free_rate) / downside_vol if downside_vol > 0 else 0.0

    curve = (1.0 + series).cumprod()
    max_drawdown = float((curve / curve.cummax() - 1.0).min())
    calmar = cagr / abs(max_drawdown) if max_drawdown < 0 else 0.0

    return PerformanceStats(total_return, cagr, volatility, sharpe, sortino, max_drawdown, calmar)


def relative_stats(
    returns: pd.Series, benchmark: pd.Series, trading_days: int, risk_free_rate: float
) -> RelativeStats:
    frame = pd.concat([returns.rename("r"), benchmark.rename("b")], axis=1).dropna()
    if len(frame) < 2:
        return RelativeStats(0.0, 0.0, 0.0, 0.0)

    daily_rf = risk_free_rate / trading_days
    excess_r = (frame["r"] - daily_rf).to_numpy()
    excess_b = (frame["b"] - daily_rf).to_numpy()
    var_b = float(np.var(excess_b, ddof=0))
    beta = float(np.cov(excess_r, excess_b, ddof=0)[0, 1] / var_b) if var_b > 0 else 0.0
    alpha = float((excess_r.mean() - beta * excess_b.mean()) * trading_days)

    active = (frame["r"] - frame["b"]).to_numpy()
    tracking_error = float(np.std(active, ddof=0) * np.sqrt(trading_days))
    information_ratio = float(active.mean() * trading_days / tracking_error) if tracking_error > 0 else 0.0

    return RelativeStats(alpha, beta, tracking_error, information_ratio)


def rolling_sharpe(returns: pd.Series, window: int, trading_days: int, risk_free_rate: float) -> pd.Series:
    series = returns.dropna()
    daily_rf = risk_free_rate / trading_days
    excess = series - daily_rf
    mean = excess.rolling(window).mean()
    std = series.rolling(window).std(ddof=0)
    return (mean / std * np.sqrt(trading_days)).dropna()
