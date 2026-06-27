from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import Profile


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
            elif email and profile.email != email:
                profile.email = email
                await session.commit()
            return ProfileData(profile.id, profile.email, profile.plan, profile.plan_selected)

    async def set_plan(self, user_id: str, plan: str) -> ProfileData | None:
        async with self._session_factory() as session:
            profile = await session.get(Profile, user_id)
            if profile is None:
                return None
            profile.plan = plan
            profile.plan_selected = True
            await session.commit()
            return ProfileData(profile.id, profile.email, profile.plan, profile.plan_selected)
