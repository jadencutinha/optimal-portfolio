from dataclasses import dataclass

from sqlalchemy import delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.auth.plans import PLANS, normalize_plan
from app.db.models import (
    Certificate,
    Enrollment,
    ExamResult,
    Profile,
    SavedPortfolio,
    TopicProgress,
)


@dataclass
class ProfileData:
    id: str
    email: str | None
    plan: str
    plan_selected: bool = False


class ProfileRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def get_or_create(self, user_id: str, email: str | None) -> ProfileData:
        async with self._session_factory() as session:
            profile = await session.get(Profile, user_id)
            if profile is None:
                profile = Profile(id=user_id, email=email, plan="free")
                session.add(profile)
                await session.commit()
            else:
                dirty = False
                if email and profile.email != email:
                    profile.email = email
                    dirty = True
                if profile.plan not in PLANS:
                    profile.plan = normalize_plan(profile.plan)
                    dirty = True
                if dirty:
                    await session.commit()
            return ProfileData(profile.id, profile.email, profile.plan, profile.plan_selected)

    async def delete_account(self, user_id: str) -> None:
        """Remove every row this app stores for the given user."""
        async with self._session_factory() as session:
            for model in (
                SavedPortfolio,
                Enrollment,
                TopicProgress,
                ExamResult,
                Certificate,
            ):
                await session.execute(sql_delete(model).where(model.user_id == user_id))
            await session.execute(sql_delete(Profile).where(Profile.id == user_id))
            await session.commit()

    async def set_plan(self, user_id: str, plan: str) -> ProfileData | None:
        async with self._session_factory() as session:
            profile = await session.get(Profile, user_id)
            if profile is None:
                return None
            profile.plan = plan
            profile.plan_selected = True
            await session.commit()
            return ProfileData(profile.id, profile.email, profile.plan, profile.plan_selected)
