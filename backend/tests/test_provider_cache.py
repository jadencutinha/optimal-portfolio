import asyncio
from datetime import date

import pandas as pd

from app.data.provider import DataProvider, PersistentPriceProvider
from app.data.repository import PriceRepository
from app.db.session import create_engine, create_session_factory, init_models


class CountingProvider(DataProvider):
    name = "fmp"

    def __init__(self) -> None:
        self.calls = 0

    async def get_prices(self, tickers, start, end):
        self.calls += 1
        index = pd.bdate_range(start, end)
        return {ticker: pd.Series(range(1, len(index) + 1), index=index, dtype=float) for ticker in tickers}


def _provider(tmp_path):
    engine = create_engine(f"sqlite+aiosqlite:///{tmp_path}/prices.db")
    repo = PriceRepository(create_session_factory(engine))
    inner = CountingProvider()
    return engine, inner, PersistentPriceProvider(inner, repo)


def test_second_request_is_served_from_the_database(tmp_path) -> None:
    async def run() -> None:
        engine, inner, provider = _provider(tmp_path)
        await init_models(engine)
        start, end = date(2024, 1, 1), date(2024, 3, 1)

        first = await provider.get_prices(["AAPL", "MSFT"], start, end)
        assert set(first) == {"AAPL", "MSFT"}
        assert inner.calls == 1

        second = await provider.get_prices(["AAPL", "MSFT"], start, end)
        assert set(second) == {"AAPL", "MSFT"}
        assert inner.calls == 1  # no second market-data fetch

        await engine.dispose()

    asyncio.run(run())


def test_stale_window_triggers_a_refetch(tmp_path) -> None:
    async def run() -> None:
        engine, inner, provider = _provider(tmp_path)
        await init_models(engine)
        start = date(2024, 1, 1)

        await provider.get_prices(["AAPL"], start, date(2024, 3, 1))
        assert inner.calls == 1

        # The database only has data through March, so a window ending in June is stale.
        await provider.get_prices(["AAPL"], start, date(2024, 6, 1))
        assert inner.calls == 2

        await engine.dispose()

    asyncio.run(run())
