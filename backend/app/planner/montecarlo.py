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
class SuccessPoint:
    month: int
    prob: float


@dataclass
class Lever:
    label: str
    delta: float


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
    success_over_time: list[SuccessPoint]
    median_months_to_goal: int | None


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

    # Odds of having reached the goal by each point in time (first-passage: once a
    # path crosses the goal it stays "reached"), plus the median time to get there.
    success_over_time: list[SuccessPoint] = []
    median_months_to_goal: int | None = None
    if target is not None:
        reached_by = np.maximum.accumulate(history >= target, axis=0)
        reached_frac = reached_by.mean(axis=1)
        success_over_time = [
            SuccessPoint(month=month, prob=float(reached_frac[month])) for month in _timeline_indices(months)
        ]
        if bool((reached_frac >= 0.5).any()):
            median_months_to_goal = int(np.argmax(reached_frac >= 0.5))

    return PlanResult(
        timeline=timeline,
        prob_success=prob_success,
        prob_large_drawdown=float(np.mean(max_drawdown >= large_drawdown)),
        median_final=float(np.median(final)),
        p10_final=float(np.percentile(final, 10)),
        p90_final=float(np.percentile(final, 90)),
        mean_final=float(np.mean(final)),
        total_contributions=total_contributions,
        success_over_time=success_over_time,
        median_months_to_goal=median_months_to_goal,
    )


_SOLVE_TRIALS = 1600
_SOLVE_SEED = 20240517


def _final_wealth(
    *,
    expected_return: float,
    volatility: float,
    initial: float,
    monthly_contribution: float,
    years: int,
    trials: int,
    seed: int,
) -> np.ndarray:
    """Just the ending wealth across trials — no history, for the many solver runs."""
    months = years * 12
    rng = np.random.default_rng(seed)
    monthly_drift = (1.0 + expected_return) ** (1.0 / 12.0) - 1.0
    monthly_vol = volatility / np.sqrt(12.0)
    draws = rng.normal(monthly_drift, monthly_vol, size=(trials, months))
    growth = np.maximum(1.0 + draws, 0.0)
    wealth = np.full(trials, float(initial))
    for step in range(months):
        wealth = wealth * growth[:, step] + monthly_contribution
    return wealth


def _success_prob(*, target: float, **kwargs) -> float:
    return float(np.mean(_final_wealth(**kwargs) >= target))


def solve_contribution(
    *,
    expected_return: float,
    volatility: float,
    initial: float,
    years: int,
    target: float,
    confidence: float,
    current_monthly: float,
    trials: int = _SOLVE_TRIALS,
    seed: int = _SOLVE_SEED,
) -> float | None:
    """Smallest monthly contribution that reaches `confidence` odds, or None if out of reach."""
    cap = max(current_monthly * 8.0, 20000.0)
    common = dict(
        expected_return=expected_return,
        volatility=volatility,
        initial=initial,
        years=years,
        trials=trials,
        seed=seed,
    )
    if _success_prob(target=target, monthly_contribution=cap, **common) < confidence:
        return None
    lo, hi = 0.0, cap
    for _ in range(18):
        mid = (lo + hi) / 2.0
        if _success_prob(target=target, monthly_contribution=mid, **common) >= confidence:
            hi = mid
        else:
            lo = mid
    return float(round(hi / 25.0) * 25.0)


def solve_years(
    *,
    expected_return: float,
    volatility: float,
    initial: float,
    monthly_contribution: float,
    target: float,
    confidence: float,
    max_years: int = 50,
    trials: int = _SOLVE_TRIALS,
    seed: int = _SOLVE_SEED,
) -> int | None:
    """Fewest whole years that reach `confidence` odds, or None if not within max_years."""
    common = dict(
        expected_return=expected_return,
        volatility=volatility,
        initial=initial,
        monthly_contribution=monthly_contribution,
        target=target,
        trials=trials,
        seed=seed,
    )
    if _success_prob(years=max_years, **common) < confidence:
        return None
    lo, hi = 1, max_years
    while lo < hi:
        mid = (lo + hi) // 2
        if _success_prob(years=mid, **common) >= confidence:
            hi = mid
        else:
            lo = mid + 1
    return int(lo)


def sensitivity_levers(
    *,
    expected_return: float,
    volatility: float,
    initial: float,
    monthly_contribution: float,
    years: int,
    target: float,
    trials: int = _SOLVE_TRIALS,
    seed: int = _SOLVE_SEED,
) -> list[Lever]:
    """How much each lever moves the odds, using common random numbers to stay low-noise."""
    common = dict(expected_return=expected_return, volatility=volatility, target=target, trials=trials, seed=seed)
    base = _success_prob(initial=initial, monthly_contribution=monthly_contribution, years=years, **common)
    plus_monthly = _success_prob(
        initial=initial, monthly_contribution=monthly_contribution + 100.0, years=years, **common
    )
    plus_initial = _success_prob(
        initial=initial + 5000.0, monthly_contribution=monthly_contribution, years=years, **common
    )
    plus_years = _success_prob(
        initial=initial, monthly_contribution=monthly_contribution, years=years + 2, **common
    )
    return [
        Lever(label="Add $100 / month", delta=plus_monthly - base),
        Lever(label="Start with $5,000 more", delta=plus_initial - base),
        Lever(label="Invest 2 more years", delta=plus_years - base),
    ]
