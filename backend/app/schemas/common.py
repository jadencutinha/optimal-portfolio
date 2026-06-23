from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str
    data_provider: str


class UniverseAsset(BaseModel):
    ticker: str
    name: str
    sector: str


class UniverseResponse(BaseModel):
    assets: list[UniverseAsset]


class OptimizationRunSummary(BaseModel):
    id: int
    created_at: datetime
    objective: str
    provider: str
    tickers: list[str]
    metrics: dict


class OptimizationRunDetail(OptimizationRunSummary):
    request: dict
    weights: dict
