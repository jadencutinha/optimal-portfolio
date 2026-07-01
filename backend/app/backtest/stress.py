from dataclasses import dataclass, field
from datetime import date

import numpy as np
import pandas as pd

from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import build_price_frame, daily_returns

STRESS_WINDOWS: list[tuple[str, str, str, date, date]] = [
    (
        "gfc_2008",
        "2008 Financial Crisis",
        "The global financial crisis — Lehman's collapse and the credit crunch.",
        date(2007, 10, 1),
        date(2010, 3, 31),
    ),
    (
        "covid_2020",
        "COVID-19 Crash",
        "The fastest bear market in history as the pandemic shut down the economy.",
        date(2020, 2, 1),
        date(2020, 12, 31),
    ),
    (
        "rate_shock_2022",
        "2022 Rate Shock",
        "Runaway inflation and aggressive Fed hikes hammered both stocks and bonds.",
        date(2022, 1, 1),
        date(2023, 6, 30),
    ),
]

_MIN_OBS = 20
_MAX_CURVE_POINTS = 160


@dataclass
class StressWindowResult:
    key: str
    label: str
    description: str
    start: date
    end: date
    available: bool
    total_return: float | None = None
    max_drawdown: float | None = None
    volatility: float | None = None
    recovered: bool | None = None
    recovery_days: int | None = None
    trough_date: date | None = None
    assets_used: int = 0
    missing_tickers: list[str] = field(default_factory=list)
    curve: list[dict] = field(default_factory=list)


def _curve_points(equity: pd.Series) -> list[dict]:
    n = len(equity)
    if n <= _MAX_CURVE_POINTS:
        indices = range(n)
    else:
        stride = int(np.ceil(n / _MAX_CURVE_POINTS))
        indices = list(range(0, n, stride))
        if indices[-1] != n - 1:
            indices.append(n - 1)
    return [
        {"date": equity.index[i].date().isoformat(), "equity": float(equity.iloc[i])}
        for i in indices
    ]


def _evaluate(weights: dict[str, float], frame: pd.DataFrame, trading_days: int) -> dict | None:
    columns = list(frame.columns)
    returns = daily_returns(frame)
    if returns.empty:
        return None
    w = np.array([weights[ticker] for ticker in columns], dtype=float)
    total = w.sum()
    if total <= 0:
        return None
    w = w / total

    port = pd.Series(returns.to_numpy() @ w, index=returns.index)
    equity = (1.0 + port).cumprod()
    equity = pd.concat([pd.Series([1.0], index=[frame.index[0]]), equity])

    running_max = equity.cummax()
    drawdown = equity / running_max - 1.0
    trough_pos = int(drawdown.to_numpy().argmin())
    peak_level = float(running_max.iloc[trough_pos])
    trough_date = equity.index[trough_pos].date()

    recovered = False
    recovery_days: int | None = None
    after = equity.iloc[trough_pos:]
    mask = (after >= peak_level).to_numpy()
    if mask.any():
        recovery_date = after.index[int(mask.argmax())].date()
        recovered = True
        recovery_days = (recovery_date - trough_date).days

    return {
        "total_return": float(equity.iloc[-1] - 1.0),
        "max_drawdown": float(drawdown.min()),
        "volatility": float(port.std() * np.sqrt(trading_days)),
        "recovered": recovered,
        "recovery_days": recovery_days,
        "trough_date": trough_date,
        "assets_used": len(columns),
        "curve": _curve_points(equity),
    }


async def run_stress(
    weights: dict[str, float],
    provider: DataProvider,
    settings: Settings,
) -> list[StressWindowResult]:
    tickers = list(weights.keys())
    results: list[StressWindowResult] = []
    for key, label, description, start, end in STRESS_WINDOWS:
        prices = await provider.get_prices(tickers, start, end)
        frame = build_price_frame(prices, _MIN_OBS)
        available = [ticker for ticker in frame.columns if ticker in weights] if not frame.empty else []
        missing = [ticker for ticker in tickers if ticker not in available]

        evaluation = _evaluate(weights, frame[available], settings.trading_days) if available else None
        if evaluation is None:
            results.append(
                StressWindowResult(
                    key=key,
                    label=label,
                    description=description,
                    start=start,
                    end=end,
                    available=False,
                    missing_tickers=tickers,
                )
            )
            continue

        results.append(
            StressWindowResult(
                key=key,
                label=label,
                description=description,
                start=start,
                end=end,
                available=True,
                missing_tickers=missing,
                **evaluation,
            )
        )
    return results
