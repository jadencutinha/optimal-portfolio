from datetime import date, timedelta

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_provider
from app.data.provider import DataProvider
from app.data.universe import UNIVERSE
from app.ratelimit import DATA, limiter
from app.schemas.tickers import TickerValidation, TickerValidationRequest, TickerValidationResponse

router = APIRouter(tags=["tickers"])

_MIN_OBS = 5
_LOOKBACK_DAYS = 150
_KNOWN_TICKERS = {row["ticker"].upper() for row in UNIVERSE}


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

    # Curated universe tickers are known-valid, so we never spend a market-data
    # request on them. Only genuinely unknown symbols are checked against the API.
    valid_set = {symbol for symbol in symbols if symbol in _KNOWN_TICKERS}
    unknown = [symbol for symbol in symbols if symbol not in _KNOWN_TICKERS]

    if unknown:
        end = date.today()
        start = end - timedelta(days=_LOOKBACK_DAYS)
        prices = await provider.get_prices(unknown, start, end)
        for symbol in unknown:
            series = prices.get(symbol)
            if series is not None and int(series.dropna().shape[0]) >= _MIN_OBS:
                valid_set.add(symbol)

    results = [TickerValidation(ticker=symbol, valid=symbol in valid_set) for symbol in symbols]
    valid = [symbol for symbol in symbols if symbol in valid_set]
    invalid = [symbol for symbol in symbols if symbol not in valid_set]
    return TickerValidationResponse(results=results, valid=valid, invalid=invalid)
