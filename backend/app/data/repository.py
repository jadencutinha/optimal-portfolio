from datetime import date

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import PriceBar


class PriceRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def load_prices(
        self, provider: str, tickers: list[str], start: date, end: date
    ) -> dict[str, pd.Series]:
        if not tickers:
            return {}
        async with self._session_factory() as session:
            result = await session.execute(
                select(PriceBar.ticker, PriceBar.bar_date, PriceBar.close)
                .where(
                    PriceBar.provider == provider,
                    PriceBar.ticker.in_(tickers),
                    PriceBar.bar_date >= start,
                    PriceBar.bar_date <= end,
                )
                .order_by(PriceBar.ticker, PriceBar.bar_date)
            )
            rows = result.all()
        grouped: dict[str, list[tuple[date, float]]] = {}
        for ticker, bar_date, close in rows:
            grouped.setdefault(ticker, []).append((bar_date, close))
        series_map: dict[str, pd.Series] = {}
        for ticker, points in grouped.items():
            index = pd.to_datetime([point[0] for point in points])
            series_map[ticker] = pd.Series([point[1] for point in points], index=index, dtype=float).sort_index()
        return series_map

    async def store_prices(self, provider: str, frame: pd.DataFrame) -> None:
        if frame.empty:
            return
        async with self._session_factory() as session:
            for ticker in frame.columns:
                series = frame[ticker].dropna()
                if series.empty:
                    continue
                lower = series.index.min().date()
                upper = series.index.max().date()
                existing = await session.execute(
                    select(PriceBar.bar_date).where(
                        PriceBar.provider == provider,
                        PriceBar.ticker == ticker,
                        PriceBar.bar_date >= lower,
                        PriceBar.bar_date <= upper,
                    )
                )
                stored = {row[0] for row in existing.all()}
                new_rows = [
                    PriceBar(provider=provider, ticker=ticker, bar_date=timestamp.date(), close=float(value))
                    for timestamp, value in series.items()
                    if timestamp.date() not in stored
                ]
                if new_rows:
                    session.add_all(new_rows)
            try:
                await session.commit()
            except Exception:
                await session.rollback()
