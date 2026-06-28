from datetime import datetime

from pydantic import BaseModel, Field


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    objective: str
    risk_model: str
    tickers: list[str]
    weights: dict[str, float]
    metrics: dict


class PortfolioSummary(BaseModel):
    id: int
    name: str
    objective: str
    risk_model: str
    metrics: dict
    created_at: datetime


class PortfolioDetail(PortfolioSummary):
    tickers: list[str]
    weights: dict[str, float]
