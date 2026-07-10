from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.backtest import BacktestObjective, RebalanceCadence
from app.schemas.optimize import RiskModel

Bias = Literal["lossAversion", "overconfidence", "anchoring"]


class BehaviorGapRequest(BaseModel):
    tickers: list[str] = Field(min_length=2, max_length=50)
    objective: BacktestObjective = "max_sharpe"
    risk_model: RiskModel = "sample"
    ewma_lambda: float = Field(default=0.94, gt=0.5, lt=1.0)
    start: date | None = None
    end: date | None = None
    history_days: int | None = Field(default=None, ge=180, le=5475)
    estimation_window: int = Field(default=252, ge=30, le=1260)
    rebalance: RebalanceCadence = "quarterly"
    cost_bps: float = Field(default=10.0, ge=0.0, le=200.0)
    max_weight: float = Field(default=0.35, gt=0.0, le=1.0)
    risk_free_rate: float | None = Field(default=None, ge=0.0, le=1.0)
    initial: float = Field(default=10000.0, gt=0.0, le=1e9)

    loss_aversion: bool = False
    overconfidence: bool = False
    anchoring: bool = False
    panic_drawdown: float = Field(default=0.20, gt=0.0, lt=1.0)

    @model_validator(mode="after")
    def _validate(self) -> "BehaviorGapRequest":
        seen: set[str] = set()
        cleaned: list[str] = []
        for ticker in self.tickers:
            symbol = ticker.strip().upper()
            if symbol and symbol not in seen:
                seen.add(symbol)
                cleaned.append(symbol)
        if len(cleaned) < 2:
            raise ValueError("At least 2 distinct tickers are required.")
        self.tickers = cleaned
        return self


class CurvePoint(BaseModel):
    date: date
    value: float
    drawdown: float


class PolicyStats(BaseModel):
    final_value: float
    total_return: float
    cagr: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    total_cost: float
    total_turnover: float
    rebalances: int
    panic_sales: int
    days_derisked: int


class PolicyResult(BaseModel):
    name: str
    stats: PolicyStats
    curve: list[CurvePoint]
    panic_dates: list[date]


class BiasDriver(BaseModel):
    bias: Bias
    behavior: str


class ToleranceCheck(BaseModel):
    stated_tolerance: float
    worst_drawdown: float
    breaches: int
    first_breach: date | None


class BehaviorGapResponse(BaseModel):
    start: date
    end: date
    initial: float
    tickers: list[str]
    disciplined: PolicyResult
    behavioral: PolicyResult
    gap_value: float
    gap_pct: float
    cagr_gap: float
    drivers: list[BiasDriver]
    tolerance: ToleranceCheck | None
