from dataclasses import dataclass, field

import numpy as np


class ConstraintError(Exception):
    pass


@dataclass
class GroupCap:
    label: str
    indices: list[int]
    max_weight: float | None = None
    min_weight: float | None = None


@dataclass
class WeightBounds:
    lower: np.ndarray
    upper: np.ndarray
    groups: list[GroupCap] = field(default_factory=list)

    @property
    def long_only(self) -> bool:
        return bool((self.lower >= -1e-9).all())


def uniform_bounds(n: int, w_min: float, w_max: float) -> WeightBounds:
    return WeightBounds(np.full(n, float(w_min)), np.full(n, float(w_max)), [])


def build_bounds(
    tickers: list[str],
    w_min: float,
    w_max: float,
    asset_bounds=None,
    sector_caps=None,
    sectors: dict[str, str] | None = None,
) -> WeightBounds:
    n = len(tickers)
    lower = np.full(n, float(w_min))
    upper = np.full(n, float(w_max))
    index = {ticker: position for position, ticker in enumerate(tickers)}

    for bound in asset_bounds or []:
        position = index.get(bound.ticker.strip().upper())
        if position is None:
            continue
        if bound.min_weight is not None:
            lower[position] = bound.min_weight
        if bound.max_weight is not None:
            upper[position] = bound.max_weight

    groups: list[GroupCap] = []
    resolved = sectors or {}
    for cap in sector_caps or []:
        members = [position for position, ticker in enumerate(tickers) if resolved.get(ticker) == cap.sector]
        if not members:
            continue
        groups.append(GroupCap(cap.sector, members, cap.max_weight, cap.min_weight))

    bounds = WeightBounds(lower, upper, groups)
    _validate(bounds)
    return bounds


def _validate(bounds: WeightBounds) -> None:
    if (bounds.lower > bounds.upper + 1e-9).any():
        raise ConstraintError("A per-asset minimum weight exceeds its maximum weight.")
    if bounds.upper.sum() < 1.0 - 1e-6:
        raise ConstraintError("Maximum weights are too low to build a fully invested portfolio.")
    if bounds.lower.sum() > 1.0 + 1e-6:
        raise ConstraintError("Minimum weights are too high to build a fully invested portfolio.")
    for group in bounds.groups:
        floor = float(bounds.lower[group.indices].sum())
        if group.max_weight is not None and group.max_weight < floor - 1e-9:
            raise ConstraintError(
                f"Sector cap for {group.label} is below the floor implied by its per-asset minimums."
            )
        if group.max_weight is not None and group.min_weight is not None and group.min_weight > group.max_weight + 1e-9:
            raise ConstraintError(f"Sector minimum for {group.label} exceeds its maximum.")
