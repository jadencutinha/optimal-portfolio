from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import OptimizationRun


class OptimizationRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def save(
        self,
        *,
        objective: str,
        provider: str,
        tickers: list[str],
        request: dict,
        weights: dict,
        metrics: dict,
    ) -> int:
        async with self._session_factory() as session:
            run = OptimizationRun(
                objective=objective,
                provider=provider,
                tickers=tickers,
                request=request,
                weights=weights,
                metrics=metrics,
            )
            session.add(run)
            await session.commit()
            await session.refresh(run)
            return run.id

    async def list_recent(self, limit: int = 20) -> list[OptimizationRun]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(OptimizationRun).order_by(desc(OptimizationRun.created_at)).limit(limit)
            )
            return list(result.scalars().all())

    async def get(self, run_id: int) -> OptimizationRun | None:
        async with self._session_factory() as session:
            return await session.get(OptimizationRun, run_id)
