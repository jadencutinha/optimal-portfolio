from dataclasses import dataclass

import numpy as np

_PERCENTILES = (10, 25, 50, 75, 90)
_MAX_TIMELINE_POINTS = 180


@dataclass
class PlanPoint:
    month: int
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float


@dataclass
class PlanResult:
    timeline: list[PlanPoint]
    prob_success: float | None
    prob_large_drawdown: float
    median_final: float
    p10_final: float
    p90_final: float
    mean_final: float
    total_contributions: float


def _timeline_indices(months: int) -> list[int]:
    if months <= _MAX_TIMELINE_POINTS:
        return list(range(months + 1))
    stride = int(np.ceil(months / _MAX_TIMELINE_POINTS))
    indices = list(range(0, months + 1, stride))
    if indices[-1] != months:
        indices.append(months)
    return indices


def simulate(
    *,
    expected_return: float,
    volatility: float,
    initial: float,
    monthly_contribution: float,
    years: int,
    target: float | None = None,
    trials: int = 2000,
    large_drawdown: float = 0.30,
    seed: int | None = None,
) -> PlanResult:
    months = years * 12
    rng = np.random.default_rng(seed)
    monthly_drift = (1.0 + expected_return) ** (1.0 / 12.0) - 1.0
    monthly_vol = volatility / np.sqrt(12.0)
    draws = rng.normal(monthly_drift, monthly_vol, size=(trials, months))
    growth = np.maximum(1.0 + draws, 0.0)

    wealth = np.full(trials, float(initial))
    peak = np.full(trials, float(initial))
    max_drawdown = np.zeros(trials)

    history = np.empty((months + 1, trials), dtype=float)
    history[0] = wealth
    for step in range(months):
        wealth = wealth * growth[:, step] + monthly_contribution
        peak = np.maximum(peak, wealth)
        drawdown = np.where(peak > 0, (peak - wealth) / peak, 0.0)
        max_drawdown = np.maximum(max_drawdown, drawdown)
        history[step + 1] = wealth

    timeline: list[PlanPoint] = []
    for month in _timeline_indices(months):
        p10, p25, p50, p75, p90 = np.percentile(history[month], _PERCENTILES)
        timeline.append(
            PlanPoint(
                month=month,
                p10=float(p10),
                p25=float(p25),
                p50=float(p50),
                p75=float(p75),
                p90=float(p90),
            )
        )

    final = history[months]
    prob_success = float(np.mean(final >= target)) if target is not None else None
    total_contributions = float(initial) + float(monthly_contribution) * months

    return PlanResult(
        timeline=timeline,
        prob_success=prob_success,
        prob_large_drawdown=float(np.mean(max_drawdown >= large_drawdown)),
        median_final=float(np.median(final)),
        p10_final=float(np.percentile(final, 10)),
        p90_final=float(np.percentile(final, 90)),
        mean_final=float(np.mean(final)),
        total_contributions=total_contributions,
    )
