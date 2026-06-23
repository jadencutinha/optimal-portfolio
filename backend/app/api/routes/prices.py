from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_provider, get_settings
from app.config import Settings
from app.data.provider import DataProvider
from app.schemas.prices import PricePoint, PricesResponse, TickerPrices

router = APIRouter(tags=["prices"])


@router.get("/prices", response_model=PricesResponse)
async def prices(
    tickers: str = Query(..., description="Comma separated list of tickers"),
    start: date | None = None,
    end: date | None = None,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
) -> PricesResponse:
    symbols = [symbol.strip().upper() for symbol in tickers.split(",") if symbol.strip()]
    if not symbols:
        raise HTTPException(status_code=400, detail="Provide at least one ticker.")
    resolved_end = end or date.today()
    resolved_start = start or resolved_end - timedelta(days=settings.default_lookback_days)
    if resolved_start >= resolved_end:
        raise HTTPException(status_code=400, detail="start must be before end.")

    data = await provider.get_prices(symbols, resolved_start, resolved_end)
    if not data:
        raise HTTPException(status_code=404, detail="No price data returned for the requested tickers.")

    series = [
        TickerPrices(
            ticker=ticker,
            points=[PricePoint(date=timestamp.date(), close=float(value)) for timestamp, value in observations.items()],
        )
        for ticker, observations in data.items()
    ]
    return PricesResponse(provider=provider.name, start=resolved_start, end=resolved_end, series=series)
