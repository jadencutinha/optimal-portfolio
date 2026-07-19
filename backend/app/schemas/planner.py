from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    expected_return: float = Field(ge=-1.0, le=2.0)
    volatility: float = Field(gt=0.0, le=3.0)
    initial: float = Field(default=10000.0, ge=0.0, le=1e9)
    monthly_contribution: float = Field(default=0.0, ge=0.0, le=1e7)
    years: int = Field(default=20, ge=1, le=50)
    target: float | None = Field(default=None, gt=0.0, le=1e12)
    trials: int = Field(default=2000, ge=200, le=10000)
    large_drawdown: float = Field(default=0.30, gt=0.0, lt=1.0)
    solve_confidence: float = Field(default=0.85, ge=0.5, le=0.99)
    seed: int | None = Field(default=None, ge=0, le=2**31 - 1)


class PlanPointSchema(BaseModel):
    month: int
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float


class SuccessPointSchema(BaseModel):
    month: int
    prob: float


class LeverSchema(BaseModel):
    label: str
    delta: float


class PlanResponse(BaseModel):
    years: int
    months: int
    trials: int
    target: float | None
    total_contributions: float
    prob_success: float | None
    prob_large_drawdown: float
    large_drawdown: float
    median_final: float
    mean_final: float
    p10_final: float
    p90_final: float
    timeline: list[PlanPointSchema]
    solve_confidence: float
    solved_monthly: float | None
    solved_years: int | None
    median_months_to_goal: int | None
    success_over_time: list[SuccessPointSchema]
    levers: list[LeverSchema]
