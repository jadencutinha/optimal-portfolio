from __future__ import annotations

from pydantic import BaseModel


class Quote(BaseModel):
    symbol: str
    price: float
    previous_close: float
    change: float
    change_pct: float
    as_of: str | None = None


class QuoteBoard(BaseModel):
    quotes: list[Quote]
    source: str
    feed: str
    as_of: str | None = None
