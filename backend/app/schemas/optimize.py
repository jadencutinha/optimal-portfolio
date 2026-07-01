from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

Objective = Literal[
    "min_variance",
    "max_sharpe",
    "target_return",
    "target_risk",
    "risk_parity",
    "max_diversification",
    "cvar",
    "cost_aware",
    "hrp",
]
RiskModel = Literal["sample", "ledoit_wolf", "ewma", "factor"]
ReturnModel = Literal["historical", "black_litterman"]


class AssetBound(BaseModel):
    ticker: str
    min_weight: float | None = Field(default=None, ge=-1.0, le=1.0)
    max_weight: float | None = Field(default=None, gt=0.0, le=1.0)


class SectorCap(BaseModel):
    sector: str
    max_weight: float | None = Field(default=None, gt=0.0, le=1.0)
    min_weight: float | None = Field(default=None, ge=0.0, le=1.0)


class OptimizeRequest(BaseModel):
    tickers: list[str] = Field(min_length=2, max_length=50)
    objective: Objective = "max_sharpe"
    risk_model: RiskModel = "sample"
    return_model: ReturnModel = "historical"
    ewma_lambda: float = Field(default=0.94, gt=0.5, lt=1.0)
    cvar_alpha: float = Field(default=0.95, ge=0.8, lt=1.0)
    bl_risk_aversion: float = Field(default=2.5, gt=0.0, le=50.0)
    risk_aversion: float = Field(default=5.0, gt=0.0, le=100.0)
    transaction_cost_bps: float = Field(default=10.0, ge=0.0, le=200.0)
    prev_weights: dict[str, float] | None = None
    target_return: float | None = Field(default=None, ge=-1.0, le=2.0)
    target_risk: float | None = Field(default=None, gt=0.0, le=2.0)
    start: date | None = None
    end: date | None = None
    lookback_days: int | None = Field(default=None, ge=30, le=3650)
    min_weight: float = Field(default=0.0, ge=-1.0, le=1.0)
    max_weight: float = Field(default=1.0, gt=0.0, le=1.0)
    asset_bounds: list[AssetBound] = Field(default_factory=list)
    sector_caps: list[SectorCap] = Field(default_factory=list)
    risk_free_rate: float | None = Field(default=None, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def _validate(self) -> "OptimizeRequest":
        seen: set[str] = set()
        cleaned: list[str] = []
        for ticker in self.tickers:
            symbol = ticker.strip().upper()
            if symbol and symbol not in seen:
                seen.add(symbol)
                cleaned.append(symbol)
        if len(cleaned) < 2:
            raise ValueError("Provide at least two distinct tickers.")
        self.tickers = cleaned
        if self.min_weight >= self.max_weight:
            raise ValueError("min_weight must be less than max_weight.")
        if self.max_weight * len(cleaned) < 1.0:
            raise ValueError("max_weight is too low to build a fully invested portfolio.")
        if self.min_weight * len(cleaned) > 1.0:
            raise ValueError("min_weight is too high to build a fully invested portfolio.")
        if self.objective == "target_return" and self.target_return is None:
            raise ValueError("target_return is required when objective is target_return.")
        if self.objective == "target_risk" and self.target_risk is None:
            raise ValueError("target_risk is required when objective is target_risk.")
        return self


class WeightAllocation(BaseModel):
    ticker: str
    weight: float
    sector: str | None = None


class PortfolioMetrics(BaseModel):
    expected_return: float
    volatility: float
    sharpe_ratio: float


class OptimizeResponse(BaseModel):
    objective: Objective
    provider: str
    risk_model: RiskModel
    as_of_start: date
    as_of_end: date
    n_assets: int
    solver_status: str
    risk_free_rate: float
    covariance_shrinkage: float | None = None
    turnover: float | None = None
    transaction_cost: float | None = None
    weights: list[WeightAllocation]
    metrics: PortfolioMetrics
    run_id: int | None = None


class FrontierPointSchema(BaseModel):
    expected_return: float
    volatility: float
    sharpe_ratio: float
    weights: list[WeightAllocation]


class FrontierResponse(BaseModel):
    provider: str
    risk_model: RiskModel
    as_of_start: date
    as_of_end: date
    risk_free_rate: float
    points: list[FrontierPointSchema]
    min_variance_index: int
    tangency_index: int


class ResampledFrontierRequest(BaseModel):
    tickers: list[str] = Field(min_length=2, max_length=50)
    lookback_days: int | None = Field(default=None, ge=30, le=3650)
    min_weight: float = Field(default=0.0, ge=-1.0, le=1.0)
    max_weight: float = Field(default=1.0, gt=0.0, le=1.0)
    risk_model: RiskModel = "sample"
    points: int = Field(default=12, ge=5, le=25)
    resamples: int = Field(default=15, ge=5, le=40)
    risk_free_rate: float | None = Field(default=None, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def _validate(self) -> "ResampledFrontierRequest":
        seen: set[str] = set()
        cleaned: list[str] = []
        for ticker in self.tickers:
            symbol = ticker.strip().upper()
            if symbol and symbol not in seen:
                seen.add(symbol)
                cleaned.append(symbol)
        if len(cleaned) < 2:
            raise ValueError("Provide at least two distinct tickers.")
        self.tickers = cleaned
        if self.min_weight >= self.max_weight:
            raise ValueError("min_weight must be less than max_weight.")
        if self.max_weight * len(cleaned) < 1.0:
            raise ValueError("max_weight is too low to build a fully invested portfolio.")
        return self


class ResampledFrontierResponse(BaseModel):
    provider: str
    risk_model: RiskModel
    as_of_start: date
    as_of_end: date
    risk_free_rate: float
    resamples: int
    sample: list[FrontierPointSchema]
    resampled: list[FrontierPointSchema]
