from __future__ import annotations

from pydantic import BaseModel, Field


class AccountSummary(BaseModel):
    status: str
    currency: str
    cash: float
    equity: float
    portfolio_value: float
    buying_power: float
    long_market_value: float
    configured: bool = True


class Position(BaseModel):
    symbol: str
    qty: float
    avg_entry_price: float
    current_price: float
    market_value: float
    cost_basis: float
    unrealized_pl: float
    unrealized_plpc: float
    change_today: float


class InvestRequest(BaseModel):
    weights: dict[str, float] = Field(..., min_length=1)
    amount: float = Field(..., gt=0)


class OrderResult(BaseModel):
    symbol: str
    notional: float
    status: str
    order_id: str | None = None
    message: str | None = None


class InvestSummary(BaseModel):
    amount: float
    fee: float
    fee_bps: int
    invested: float
    plan: str
    orders: list[OrderResult]


class HistoryPoint(BaseModel):
    timestamp: int
    equity: float
    profit_loss: float


class PortfolioHistory(BaseModel):
    window: str
    timeframe: str
    base_value: float
    points: list[HistoryPoint]


class OrderRecord(BaseModel):
    id: str
    symbol: str
    side: str
    notional: float | None = None
    qty: float | None = None
    filled_qty: float | None = None
    status: str
    submitted_at: str | None = None
    filled_avg_price: float | None = None


class BenchmarkPoint(BaseModel):
    timestamp: int
    portfolio: float
    benchmark: float


class BenchmarkSeries(BaseModel):
    window: str
    symbol: str
    base_value: float
    portfolio_return: float
    benchmark_return: float
    alpha: float
    tracking_error: float
    points: list[BenchmarkPoint]


class DriftRow(BaseModel):
    symbol: str
    current_value: float
    current_weight: float
    target_weight: float
    target_value: float
    delta: float
    action: str


class RebalancePlan(BaseModel):
    portfolio_id: int
    portfolio_name: str
    total_value: float
    max_drift: float
    fee: float
    fee_bps: int
    rows: list[DriftRow]
    tradable: bool
    message: str | None = None


class RebalanceRequest(BaseModel):
    portfolio_id: int


class RebalanceSummary(BaseModel):
    sells: list[OrderResult]
    buys: list[OrderResult]
    fee: float


class TradeRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=12)
    side: str = Field(..., pattern="^(buy|sell)$")
    notional: float = Field(..., gt=0)
