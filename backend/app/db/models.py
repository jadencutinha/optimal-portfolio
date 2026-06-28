from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, String, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PriceBar(Base):
    __tablename__ = "price_bars"
    __table_args__ = (UniqueConstraint("provider", "ticker", "bar_date", name="uq_price_bar"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(String(32), index=True)
    ticker: Mapped[str] = mapped_column(String(16), index=True)
    bar_date: Mapped[date] = mapped_column(Date, index=True)
    close: Mapped[float] = mapped_column(Float)


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    plan: Mapped[str] = mapped_column(String(16), default="free", server_default="free")
    plan_selected: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    objective: Mapped[str] = mapped_column(String(32), index=True)
    provider: Mapped[str] = mapped_column(String(32))
    tickers: Mapped[list] = mapped_column(JSON)
    request: Mapped[dict] = mapped_column(JSON)
    weights: Mapped[dict] = mapped_column(JSON)
    metrics: Mapped[dict] = mapped_column(JSON)


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    tickers: Mapped[list] = mapped_column(JSON)
    config: Mapped[dict] = mapped_column(JSON)
    result: Mapped[dict] = mapped_column(JSON)


class SavedPortfolio(Base):
    __tablename__ = "saved_portfolios"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(120))
    objective: Mapped[str] = mapped_column(String(32))
    risk_model: Mapped[str] = mapped_column(String(32))
    tickers: Mapped[list] = mapped_column(JSON)
    weights: Mapped[dict] = mapped_column(JSON)
    metrics: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_enrollment"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    course_id: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TopicProgress(Base):
    __tablename__ = "topic_progress"
    __table_args__ = (UniqueConstraint("user_id", "course_id", "topic_id", name="uq_topic_progress"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    course_id: Mapped[str] = mapped_column(String(64), index=True)
    topic_id: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ExamResult(Base):
    __tablename__ = "exam_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    course_id: Mapped[str] = mapped_column(String(64), index=True)
    score: Mapped[int] = mapped_column()
    total: Mapped[int] = mapped_column()
    passed: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_certificate"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    course_id: Mapped[str] = mapped_column(String(64), index=True)
    credential_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
