from sqlalchemy import delete as sql_delete
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import SavedPortfolio


class PortfolioRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def count(self, user_id: str) -> int:
        async with self._session_factory() as session:
            result = await session.execute(
                select(func.count()).select_from(SavedPortfolio).where(SavedPortfolio.user_id == user_id)
            )
            return int(result.scalar_one())

    async def save(
        self,
        *,
        user_id: str,
        name: str,
        objective: str,
        risk_model: str,
        tickers: list[str],
        weights: dict,
        metrics: dict,
    ) -> int:
        async with self._session_factory() as session:
            portfolio = SavedPortfolio(
                user_id=user_id,
                name=name,
                objective=objective,
                risk_model=risk_model,
                tickers=tickers,
                weights=weights,
                metrics=metrics,
            )
            session.add(portfolio)
            await session.commit()
            await session.refresh(portfolio)
            return portfolio.id

    async def list_for_user(self, user_id: str) -> list[SavedPortfolio]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(SavedPortfolio)
                .where(SavedPortfolio.user_id == user_id)
                .order_by(desc(SavedPortfolio.created_at))
            )
            return list(result.scalars().all())

    async def get(self, user_id: str, portfolio_id: int) -> SavedPortfolio | None:
        async with self._session_factory() as session:
            result = await session.execute(
                select(SavedPortfolio).where(
                    SavedPortfolio.id == portfolio_id, SavedPortfolio.user_id == user_id
                )
            )
            return result.scalar_one_or_none()

    async def delete(self, user_id: str, portfolio_id: int) -> bool:
        async with self._session_factory() as session:
            result = await session.execute(
                sql_delete(SavedPortfolio).where(
                    SavedPortfolio.id == portfolio_id, SavedPortfolio.user_id == user_id
                )
            )
            await session.commit()
            return result.rowcount > 0
