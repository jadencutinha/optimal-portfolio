from typing import Literal

import numpy as np
import pandas as pd

RiskModel = Literal["sample", "ledoit_wolf", "ewma"]

RISK_MODELS: tuple[RiskModel, ...] = ("sample", "ledoit_wolf", "ewma")


def _symmetrize(matrix: np.ndarray) -> np.ndarray:
    return (matrix + matrix.T) / 2.0


def _sample(returns: np.ndarray) -> np.ndarray:
    centered = returns - returns.mean(axis=0)
    t = centered.shape[0]
    return (centered.T @ centered) / t


def _ewma(returns: np.ndarray, decay: float) -> np.ndarray:
    centered = returns - returns.mean(axis=0)
    t = centered.shape[0]
    ages = np.arange(t - 1, -1, -1)
    weights = (1.0 - decay) * decay**ages
    weights /= weights.sum()
    return (centered * weights[:, None]).T @ centered


def _ledoit_wolf(returns: np.ndarray) -> tuple[np.ndarray, float]:
    t, n = returns.shape
    if n < 2 or t < 2:
        return _sample(returns), 0.0
    centered = returns - returns.mean(axis=0)
    sample = (centered.T @ centered) / t
    variance = np.diag(sample).reshape(-1, 1)
    std = np.sqrt(np.clip(variance, 1e-12, None))
    std_outer = std @ std.T
    rbar = (np.sum(sample / std_outer) - n) / (n * (n - 1))
    prior = rbar * std_outer
    np.fill_diagonal(prior, variance.flatten())

    squared = centered**2
    phi_mat = (squared.T @ squared) / t - sample**2
    phi = phi_mat.sum()

    helper = (centered.T @ centered) / t
    help_diag = np.diag(helper).reshape(-1, 1)
    term1 = ((centered**3).T @ centered) / t
    theta_mat = term1 - help_diag * sample - helper * variance + variance * sample
    np.fill_diagonal(theta_mat, 0.0)
    rho = np.diag(phi_mat).sum() + rbar * np.sum((1.0 / std @ std.T) * theta_mat)

    gamma = float(np.sum((sample - prior) ** 2))
    if gamma <= 0.0:
        return sample, 0.0
    kappa = (phi - rho) / gamma
    shrinkage = float(max(0.0, min(1.0, kappa / t)))
    return shrinkage * prior + (1.0 - shrinkage) * sample, shrinkage


def estimate_covariance(
    returns: pd.DataFrame, trading_days: int, model: RiskModel, ewma_lambda: float = 0.94
) -> tuple[np.ndarray, float | None]:
    values = returns.to_numpy(dtype=float)
    if model == "ledoit_wolf":
        daily, shrinkage = _ledoit_wolf(values)
        return _symmetrize(daily) * trading_days, shrinkage
    if model == "ewma":
        return _symmetrize(_ewma(values, ewma_lambda)) * trading_days, None
    return _symmetrize(_sample(values)) * trading_days, None
