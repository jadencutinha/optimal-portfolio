import hashlib
from datetime import date

import numpy as np
import pandas as pd

from app.data.provider import DataProvider


def _seed(text: str) -> int:
    return int(hashlib.sha256(text.encode()).hexdigest(), 16) % (2**32)


class SampleProvider(DataProvider):
    name = "sample"

    def __init__(self, trading_days: int = 252) -> None:
        self._trading_days = trading_days

    async def get_prices(self, tickers: list[str], start: date, end: date) -> dict[str, pd.Series]:
        sessions = pd.bdate_range(start=start, end=end)
        if len(sessions) < 2:
            return {}
        periods = len(sessions)
        market_rng = np.random.default_rng(_seed("__market__"))
        market = market_rng.normal(
            0.06 / self._trading_days,
            0.16 / np.sqrt(self._trading_days),
            periods,
        )
        prices: dict[str, pd.Series] = {}
        for ticker in tickers:
            rng = np.random.default_rng(_seed(ticker))
            beta = rng.uniform(0.5, 1.5)
            alpha = rng.normal(0.02, 0.04) / self._trading_days
            idiosyncratic_vol = rng.uniform(0.12, 0.32) / np.sqrt(self._trading_days)
            idiosyncratic = rng.normal(0.0, idiosyncratic_vol, periods)
            daily = alpha + beta * market + idiosyncratic
            series = pd.Series(100.0 * np.cumprod(1.0 + daily), index=sessions, dtype=float)
            prices[ticker] = series
        return prices
