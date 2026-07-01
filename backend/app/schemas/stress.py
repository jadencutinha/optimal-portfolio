from datetime import date

from pydantic import BaseModel

from app.schemas.optimize import WeightAllocation


class StressCurvePoint(BaseModel):
    date: date
    equity: float


class StressWindowSchema(BaseModel):
    key: str
    label: str
    description: str
    start: date
    end: date
    available: bool
    total_return: float | None = None
    max_drawdown: float | None = None
    volatility: float | None = None
    recovered: bool | None = None
    recovery_days: int | None = None
    trough_date: date | None = None
    assets_used: int = 0
    missing_tickers: list[str] = []
    curve: list[StressCurvePoint] = []


class StressResponse(BaseModel):
    objective: str
    provider: str
    weights: list[WeightAllocation]
    windows: list[StressWindowSchema]
