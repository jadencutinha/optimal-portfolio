import asyncio

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.auth.repository import ProfileRepository
from app.db.models import Base


def _run(coro):
    return asyncio.run(coro)


async def _exercise() -> None:
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    repository = ProfileRepository(session_factory)

    created = await repository.get_or_create("user-1", "a@b.com")
    assert created.plan == "free"
    assert created.plan_selected is False

    updated = await repository.set_plan("user-1", "pro")
    assert updated is not None
    assert updated.plan == "pro"
    assert updated.plan_selected is True

    again = await repository.get_or_create("user-1", "a@b.com")
    assert again.plan == "pro"
    assert again.plan_selected is True

    await engine.dispose()


def test_profile_creation_and_plan_switch() -> None:
    _run(_exercise())
