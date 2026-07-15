from datetime import date, timedelta

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_provider
from app.data.provider import DataProvider
from app.ratelimit import DATA, limiter
from app.schemas.tickers import TickerValidation, TickerValidationRequest, TickerValidationResponse

router = APIRouter(tags=["tickers"])

_MIN_OBS = 5
_LOOKBACK_DAYS = 150


@router.post("/tickers/validate", response_model=TickerValidationResponse)
@limiter.limit(DATA)
async def validate_tickers(
    request: Request,
    payload: TickerValidationRequest,
    provider: DataProvider = Depends(get_provider),
) -> TickerValidationResponse:
    seen: set[str] = set()
    symbols: list[str] = []
    for ticker in payload.tickers:
        symbol = ticker.strip().upper()
        if symbol and symbol not in seen:
            seen.add(symbol)
            symbols.append(symbol)

    end = date.today()
    start = end - timedelta(days=_LOOKBACK_DAYS)
    prices = await provider.get_prices(symbols, start, end)

    results: list[TickerValidation] = []
    valid: list[str] = []
    invalid: list[str] = []
    for symbol in symbols:
        series = prices.get(symbol)
        ok = series is not None and int(series.dropna().shape[0]) >= _MIN_OBS
        results.append(TickerValidation(ticker=symbol, valid=ok))
        (valid if ok else invalid).append(symbol)

    return TickerValidationResponse(results=results, valid=valid, invalid=invalid)
