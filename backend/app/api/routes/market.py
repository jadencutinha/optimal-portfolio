from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.deps import get_alpaca_client
from app.invest.client import AlpacaClient, InvestError
from app.ratelimit import DATA, limiter
from app.schemas.market import Quote, QuoteBoard

router = APIRouter(tags=["market"])

MAX_SYMBOLS = 25
SOURCE = "Alpaca Market Data"
FEED = "IEX"


def _f(value: object) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0.0


def _quote(symbol: str, snapshot: dict) -> Quote | None:
    if not isinstance(snapshot, dict):
        return None

    daily = snapshot.get("dailyBar") or {}
    previous = snapshot.get("prevDailyBar") or {}
    trade = snapshot.get("latestTrade") or {}

    price = _f(trade.get("p")) or _f(daily.get("c"))
    previous_close = _f(previous.get("c")) or _f(daily.get("o"))
    if price <= 0 or previous_close <= 0:
        return None

    change = price - previous_close
    return Quote(
        symbol=symbol.upper(),
        price=round(price, 4),
        previous_close=round(previous_close, 4),
        change=round(change, 4),
        change_pct=change / previous_close,
        as_of=trade.get("t") or daily.get("t"),
    )


@router.get("/market/quotes", response_model=QuoteBoard)
@limiter.limit(DATA)
async def quotes(
    request: Request,
    symbols: str = Query(..., min_length=1),
    client: AlpacaClient = Depends(get_alpaca_client),
) -> QuoteBoard:
    wanted = [item.strip().upper() for item in symbols.split(",") if item.strip()]
    if not wanted:
        raise HTTPException(status_code=400, detail="Provide at least one ticker.")
    if len(wanted) > MAX_SYMBOLS:
        raise HTTPException(status_code=400, detail=f"Ask for at most {MAX_SYMBOLS} tickers at a time.")

    try:
        snapshots = await client.get_snapshots(wanted)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    board: list[Quote] = []
    for symbol in wanted:
        quote = _quote(symbol, snapshots.get(symbol) or {})
        if quote is not None:
            board.append(quote)

    latest = max((quote.as_of for quote in board if quote.as_of), default=None)
    return QuoteBoard(quotes=board, source=SOURCE, feed=FEED, as_of=latest)
