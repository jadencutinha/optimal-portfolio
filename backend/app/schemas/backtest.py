from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.optimize import RiskModel

BacktestObjective = Literal["min_variance", "max_sharpe"]
RebalanceCadence = Literal["monthly", "quarterly", "annual"]
BenchmarkName = Literal["index", "equal_weight", "sixty_forty"]


class BacktestRequest(BaseModel):
    tickers: list[str] = Field(min_length=2, max_length=50)
    objective: BacktestObjective = "max_sharpe"
    risk_model: RiskModel = "sample"
    ewma_lambda: float = Field(default=0.94, gt=0.5, lt=1.0)
    start: date | None = None
    end: date | None = None
    history_days: int | None = Field(default=None, ge=180, le=5475)
    estimation_window: int = Field(default=252, ge=30, le=1260)
    rebalance: RebalanceCadence = "monthly"
    cost_bps: float = Field(default=10.0, ge=0.0, le=200.0)
    turnover_budget: float | None = Field(default=None, gt=0.0, le=2.0)
    no_trade_band: float = Field(default=0.0, ge=0.0, le=0.5)
    min_weight: float = Field(default=0.0, ge=-1.0, le=1.0)
    max_weight: float = Field(default=1.0, gt=0.0, le=1.0)
    benchmarks: list[BenchmarkName] = Field(default_factory=lambda: ["index", "equal_weight", "sixty_forty"])
    risk_free_rate: float | None = Field(default=None, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def _validate(self) -> "BacktestRequest":
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


class CurvePoint(BaseModel):
    date: date
    equity: float
    drawdown: float


class RollingPoint(BaseModel):
    date: date
    sharpe: float


class StrategyStats(BaseModel):
    total_return: float
    cagr: float
    annual_volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    calmar_ratio: float
    avg_turnover: float
    transaction_cost: float


class RelativeStatsSchema(BaseModel):
    alpha: float
    beta: float
    tracking_error: float
    information_ratio: float


class StrategyResult(BaseModel):
    name: str
    kind: Literal["strategy", "benchmark"]
    stats: StrategyStats
    relative: RelativeStatsSchema | None = None
    curve: list[CurvePoint]
    rolling_sharpe: list[RollingPoint]


class BacktestResponse(BaseModel):
    provider: str
    as_of_start: date
    as_of_end: date
    rebalance: RebalanceCadence
    cost_bps: float
    risk_free_rate: float
    strategies: list[StrategyResult]
    run_id: int | None = None
