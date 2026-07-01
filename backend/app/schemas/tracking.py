from datetime import date

from pydantic import BaseModel, Field


class TrackRequest(BaseModel):
    weights: dict[str, float] = Field(min_length=1)
    lookback_days: int = Field(default=180, ge=30, le=3650)
    band: float = Field(default=0.05, gt=0.0, lt=1.0)


class TrackHoldingSchema(BaseModel):
    ticker: str
    target: float
    current: float
    drift: float


class TrackPoint(BaseModel):
    date: date
    drift: float


class TrackResponse(BaseModel):
    as_of: date
    total_return: float
    max_drift: float
    turnover_to_rebalance: float
    rebalance_needed: bool
    band: float
    top_drifter: str | None
    holdings: list[TrackHoldingSchema]
    timeline: list[TrackPoint]
    missing_tickers: list[str]
