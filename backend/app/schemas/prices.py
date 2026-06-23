from datetime import date

from pydantic import BaseModel


class PricePoint(BaseModel):
    date: date
    close: float


class TickerPrices(BaseModel):
    ticker: str
    points: list[PricePoint]


class PricesResponse(BaseModel):
    provider: str
    start: date
    end: date
    series: list[TickerPrices]
