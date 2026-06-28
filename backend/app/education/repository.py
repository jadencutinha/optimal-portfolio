import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import Certificate, Enrollment, ExamResult, Profile, TopicProgress


class CourseRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def enroll(self, user_id: str, course_id: str) -> None:
        async with self._session_factory() as session:
            existing = await session.execute(
                select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
            )
            if existing.scalar_one_or_none() is None:
                session.add(Enrollment(user_id=user_id, course_id=course_id))
                await session.commit()

    async def is_enrolled(self, user_id: str, course_id: str) -> bool:
        async with self._session_factory() as session:
            result = await session.execute(
                select(Enrollment.id).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
            )
            return result.scalar_one_or_none() is not None

    async def enrolled_courses(self, user_id: str) -> set[str]:
        async with self._session_factory() as session:
            result = await session.execute(select(Enrollment.course_id).where(Enrollment.user_id == user_id))
            return set(result.scalars().all())

    async def complete_topic(self, user_id: str, course_id: str, topic_id: str) -> None:
        async with self._session_factory() as session:
            existing = await session.execute(
                select(TopicProgress).where(
                    TopicProgress.user_id == user_id,
                    TopicProgress.course_id == course_id,
                    TopicProgress.topic_id == topic_id,
                )
            )
            if existing.scalar_one_or_none() is None:
                session.add(TopicProgress(user_id=user_id, course_id=course_id, topic_id=topic_id))
                await session.commit()

    async def completed_topics(self, user_id: str, course_id: str) -> list[str]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(TopicProgress.topic_id).where(
                    TopicProgress.user_id == user_id, TopicProgress.course_id == course_id
                )
            )
            return list(result.scalars().all())

    async def save_exam(self, user_id: str, course_id: str, score: int, total: int, passed: bool) -> None:
        async with self._session_factory() as session:
            session.add(ExamResult(user_id=user_id, course_id=course_id, score=score, total=total, passed=passed))
            await session.commit()

    async def issue_certificate(self, user_id: str, course_id: str) -> Certificate:
        async with self._session_factory() as session:
            existing = await session.execute(
                select(Certificate).where(Certificate.user_id == user_id, Certificate.course_id == course_id)
            )
            certificate = existing.scalar_one_or_none()
            if certificate is None:
                certificate = Certificate(user_id=user_id, course_id=course_id, credential_id=uuid.uuid4().hex)
                session.add(certificate)
                await session.commit()
                await session.refresh(certificate)
            return certificate

    async def get_certificate(self, user_id: str, course_id: str) -> Certificate | None:
        async with self._session_factory() as session:
            result = await session.execute(
                select(Certificate).where(Certificate.user_id == user_id, Certificate.course_id == course_id)
            )
            return result.scalar_one_or_none()

    async def completed_courses(self, user_id: str) -> set[str]:
        async with self._session_factory() as session:
            result = await session.execute(select(Certificate.course_id).where(Certificate.user_id == user_id))
            return set(result.scalars().all())

    async def get_certificate_by_credential(self, credential_id: str) -> Certificate | None:
        async with self._session_factory() as session:
            result = await session.execute(
                select(Certificate).where(Certificate.credential_id == credential_id)
            )
            return result.scalar_one_or_none()

    async def get_profile_email(self, user_id: str) -> str | None:
        async with self._session_factory() as session:
            result = await session.execute(select(Profile.email).where(Profile.id == user_id))
            return result.scalar_one_or_none()
