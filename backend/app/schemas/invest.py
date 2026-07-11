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
