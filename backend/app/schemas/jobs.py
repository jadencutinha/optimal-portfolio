from pydantic import BaseModel, Field

from app.schemas.optimize import Objective, RiskModel


class SweepRequest(BaseModel):
    tickers: list[str] = Field(min_length=2, max_length=50)
    lookback_days: int | None = Field(default=None, ge=30, le=3650)
    max_weight: float = Field(default=1.0, gt=0.0, le=1.0)
    objectives: list[Objective] = Field(min_length=1)
    risk_models: list[RiskModel] = Field(min_length=1)


class JobSubmitResponse(BaseModel):
    job_id: str
    total: int


class JobStatus(BaseModel):
    id: str
    status: str
    progress: float
    completed: int
    total: int
    result: dict | None = None
    error: str | None = None
