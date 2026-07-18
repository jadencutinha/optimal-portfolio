from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import BillingCustomer


class BillingRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def get(self, user_id: str) -> BillingCustomer | None:
        async with self._session_factory() as session:
            return await session.get(BillingCustomer, user_id)

    async def get_by_customer(self, stripe_customer_id: str) -> BillingCustomer | None:
        async with self._session_factory() as session:
            result = await session.execute(
                select(BillingCustomer).where(BillingCustomer.stripe_customer_id == stripe_customer_id)
            )
            return result.scalar_one_or_none()

    async def upsert_customer(self, user_id: str, stripe_customer_id: str) -> BillingCustomer:
        async with self._session_factory() as session:
            record = await session.get(BillingCustomer, user_id)
            if record is None:
                record = BillingCustomer(user_id=user_id, stripe_customer_id=stripe_customer_id)
                session.add(record)
            else:
                record.stripe_customer_id = stripe_customer_id
            await session.commit()
            await session.refresh(record)
            return record

    async def set_subscription(self, user_id: str, subscription_id: str | None, status: str | None) -> None:
        async with self._session_factory() as session:
            record = await session.get(BillingCustomer, user_id)
            if record is None:
                return
            record.stripe_subscription_id = subscription_id
            record.status = status
            await session.commit()
