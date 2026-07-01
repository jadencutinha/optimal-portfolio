from dataclasses import dataclass
from datetime import date

import numpy as np
import pandas as pd

_MAX_POINTS = 120


@dataclass
class TrackHolding:
    ticker: str
    target: float
    current: float
    drift: float


@dataclass
class TrackResult:
    as_of: date
    total_return: float
    max_drift: float
    turnover_to_rebalance: float
    rebalance_needed: bool
    band: float
    top_drifter: str | None
    holdings: list[TrackHolding]
    timeline: list[dict]
    missing_tickers: list[str]


def _timeline_indices(n: int) -> list[int]:
    if n <= _MAX_POINTS:
        return list(range(n))
    stride = int(np.ceil(n / _MAX_POINTS))
    indices = list(range(0, n, stride))
    if indices[-1] != n - 1:
        indices.append(n - 1)
    return indices


def track(frame: pd.DataFrame, target: dict[str, float], band: float) -> TrackResult:
    all_tickers = list(target.keys())
    columns = [ticker for ticker in frame.columns if ticker in target]
    frame = frame[columns].dropna()
    missing = [ticker for ticker in all_tickers if ticker not in columns]

    w0 = np.array([target[ticker] for ticker in columns], dtype=float)
    w0 = w0 / w0.sum()

    prices = frame.to_numpy()
    growth = prices / prices[0]
    raw = growth * w0
    value = raw.sum(axis=1)
    drifted = raw / value[:, None]

    current = drifted[-1]
    per_asset = current - w0
    max_drift = float(np.max(np.abs(per_asset)))
    turnover = float(0.5 * np.sum(np.abs(per_asset)))

    drift_series = 0.5 * np.sum(np.abs(drifted - w0), axis=1)
    timeline = [
        {"date": frame.index[i].date().isoformat(), "drift": float(drift_series[i])}
        for i in _timeline_indices(len(frame))
    ]

    holdings = [
        TrackHolding(
            ticker=columns[i],
            target=float(w0[i]),
            current=float(current[i]),
            drift=float(per_asset[i]),
        )
        for i in range(len(columns))
    ]
    holdings.sort(key=lambda holding: abs(holding.drift), reverse=True)

    top_drifter = columns[int(np.argmax(np.abs(per_asset)))] if len(columns) else None

    return TrackResult(
        as_of=frame.index[-1].date(),
        total_return=float(value[-1] - 1.0),
        max_drift=max_drift,
        turnover_to_rebalance=turnover,
        rebalance_needed=max_drift > band,
        band=band,
        top_drifter=top_drifter,
        holdings=holdings,
        timeline=timeline,
        missing_tickers=missing,
    )
