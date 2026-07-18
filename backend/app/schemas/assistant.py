from pydantic import BaseModel, Field

from app.schemas.optimize import OptimizeResponse


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    tickers: list[str] | None = None


class AssistantConfig(BaseModel):
    tickers: list[str]
    objective: str
    risk_model: str
    return_model: str
    max_weight: float
    target_return: float | None = None
    target_risk: float | None = None
    cvar_alpha: float
    risk_aversion: float
    lookback_days: int | None = None


class AssistantResponse(BaseModel):
    model: str
    reply: str = ""
    rationale: str = ""
    explanation: str = ""
    config: AssistantConfig | None = None
    result: OptimizeResponse | None = None


class CourseAssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    track_title: str | None = None
    module_title: str | None = None


class CourseAssistantResponse(BaseModel):
    model: str
    reply: str
