from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import BacktestRun


class BacktestRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def save(self, *, tickers: list[str], config: dict, result: dict) -> int:
        async with self._session_factory() as session:
            run = BacktestRun(tickers=tickers, config=config, result=result)
            session.add(run)
            await session.commit()
            await session.refresh(run)
            return run.id

    async def get(self, run_id: int) -> BacktestRun | None:
        async with self._session_factory() as session:
            return await session.get(BacktestRun, run_id)

    async def list_recent(self, limit: int = 20) -> list[BacktestRun]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(BacktestRun).order_by(desc(BacktestRun.created_at)).limit(limit)
            )
            return list(result.scalars().all())
