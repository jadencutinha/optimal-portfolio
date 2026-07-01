from dataclasses import dataclass

import numpy as np
import pandas as pd

FACTOR_LABELS = {
    "market": "Market",
    "momentum": "Momentum",
    "low_vol": "Low volatility",
    "reversal": "Short-term reversal",
}


@dataclass
class FactorExposure:
    key: str
    label: str
    beta: float
    t_stat: float
    factor_return: float
    contribution: float


@dataclass
class FactorResult:
    exposures: list[FactorExposure]
    alpha: float
    r_squared: float
    idiosyncratic_vol: float
    observations: int
    note: str


def _long_short(returns: np.ndarray, signal: np.ndarray, long_high: bool, valid_from: int) -> np.ndarray:
    periods, n_assets = returns.shape
    third = max(1, n_assets // 3)
    factor = np.full(periods, np.nan)
    for t in range(valid_from, periods):
        row = signal[t]
        if not np.all(np.isfinite(row)):
            continue
        order = np.argsort(row)
        bottom = order[:third]
        top = order[-third:]
        if long_high:
            factor[t] = returns[t, top].mean() - returns[t, bottom].mean()
        else:
            factor[t] = returns[t, bottom].mean() - returns[t, top].mean()
    return factor


def _first_valid(series: np.ndarray) -> int:
    valid = np.where(np.isfinite(series))[0]
    return int(valid[0]) if valid.size else len(series)


def decompose(
    returns_frame: pd.DataFrame,
    weights: np.ndarray,
    risk_free_rate: float,
    trading_days: int,
) -> FactorResult:
    returns = returns_frame.to_numpy()
    periods, n_assets = returns.shape
    portfolio = returns @ weights
    rf_daily = risk_free_rate / trading_days

    cumulative = (1.0 + returns_frame).cumprod()
    momentum_signal = (cumulative.shift(21) / cumulative.shift(252) - 1.0).to_numpy()
    vol_signal = returns_frame.rolling(63).std().shift(1).to_numpy()
    reversal_signal = returns_frame.rolling(5).sum().shift(1).to_numpy()

    market = returns.mean(axis=1) - rf_daily

    candidates: dict[str, tuple[np.ndarray, int]] = {
        "market": (market, 0),
        "low_vol": (_long_short(returns, vol_signal, long_high=False, valid_from=_first_valid(vol_signal[:, 0]) + 1), 64),
        "reversal": (_long_short(returns, reversal_signal, long_high=False, valid_from=6), 6),
    }
    note = "Style factors are built from the selected universe's price history."
    if periods - 252 >= 60 and n_assets >= 3:
        candidates["momentum"] = (_long_short(returns, momentum_signal, long_high=True, valid_from=252), 252)
    else:
        note += " Momentum needs a longer window and was omitted."
    if n_assets < 3:
        note += " Size and value tilts require a fundamentals feed (market cap, book/price)."
    else:
        note += " Size and value tilts require a fundamentals feed and are not shown."

    start = max(warmup for _, warmup in candidates.values())
    start = min(start, periods - 1)
    keys = list(candidates.keys())
    factor_matrix = np.column_stack([candidates[key][0][start:] for key in keys])
    target = portfolio[start:]

    mask = np.all(np.isfinite(factor_matrix), axis=1) & np.isfinite(target)
    factor_matrix = factor_matrix[mask]
    target = target[mask]
    observations = int(target.shape[0])

    design = np.column_stack([np.ones(observations), factor_matrix])
    coefficients, *_ = np.linalg.lstsq(design, target, rcond=None)
    fitted = design @ coefficients
    residuals = target - fitted
    dof = max(observations - design.shape[1], 1)
    sigma_squared = float(residuals @ residuals) / dof

    try:
        covariance = sigma_squared * np.linalg.inv(design.T @ design)
        standard_errors = np.sqrt(np.clip(np.diag(covariance), 0.0, None))
    except np.linalg.LinAlgError:
        standard_errors = np.full(design.shape[1], np.nan)

    variance = float(((target - target.mean()) ** 2).sum())
    r_squared = 1.0 - float(residuals @ residuals) / variance if variance > 0 else 0.0

    exposures: list[FactorExposure] = []
    for index, key in enumerate(keys):
        beta = float(coefficients[index + 1])
        se = standard_errors[index + 1]
        t_stat = float(beta / se) if se and np.isfinite(se) and se > 0 else 0.0
        factor_return = float(np.nanmean(candidates[key][0]) * trading_days)
        exposures.append(
            FactorExposure(
                key=key,
                label=FACTOR_LABELS[key],
                beta=beta,
                t_stat=t_stat,
                factor_return=factor_return,
                contribution=beta * factor_return,
            )
        )

    return FactorResult(
        exposures=exposures,
        alpha=float(coefficients[0] * trading_days),
        r_squared=r_squared,
        idiosyncratic_vol=float(np.sqrt(sigma_squared * trading_days)),
        observations=observations,
        note=note,
    )
