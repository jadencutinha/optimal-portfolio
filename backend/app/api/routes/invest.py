from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_alpaca_client, get_current_user
from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData
from app.invest.client import AlpacaClient, InvestError
from app.schemas.invest import (
    AccountSummary,
    HistoryPoint,
    InvestRequest,
    InvestSummary,
    OrderRecord,
    OrderResult,
    PortfolioHistory,
    Position,
)

router = APIRouter(tags=["invest"])


def _f(value: object) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0.0


def _account(data: dict) -> AccountSummary:
    return AccountSummary(
        status=str(data.get("status", "UNKNOWN")),
        currency=str(data.get("currency", "USD")),
        cash=_f(data.get("cash")),
        equity=_f(data.get("equity")),
        portfolio_value=_f(data.get("portfolio_value")),
        buying_power=_f(data.get("buying_power")),
        long_market_value=_f(data.get("long_market_value")),
    )


def _position(data: dict) -> Position:
    return Position(
        symbol=str(data.get("symbol", "")),
        qty=_f(data.get("qty")),
        avg_entry_price=_f(data.get("avg_entry_price")),
        current_price=_f(data.get("current_price")),
        market_value=_f(data.get("market_value")),
        cost_basis=_f(data.get("cost_basis")),
        unrealized_pl=_f(data.get("unrealized_pl")),
        unrealized_plpc=_f(data.get("unrealized_plpc")),
        change_today=_f(data.get("change_today")),
    )


def _order_record(data: dict) -> OrderRecord:
    return OrderRecord(
        id=str(data.get("id", "")),
        symbol=str(data.get("symbol", "")),
        side=str(data.get("side", "")),
        notional=_f(data.get("notional")) if data.get("notional") is not None else None,
        qty=_f(data.get("qty")) if data.get("qty") is not None else None,
        filled_qty=_f(data.get("filled_qty")) if data.get("filled_qty") is not None else None,
        status=str(data.get("status", "")),
        submitted_at=data.get("submitted_at"),
        filled_avg_price=_f(data.get("filled_avg_price")) if data.get("filled_avg_price") is not None else None,
    )


@router.get("/invest/account", response_model=AccountSummary)
async def account(client: AlpacaClient = Depends(get_alpaca_client)) -> AccountSummary:
    try:
        return _account(await client.get_account())
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invest/positions", response_model=list[Position])
async def positions(client: AlpacaClient = Depends(get_alpaca_client)) -> list[Position]:
    try:
        return [_position(item) for item in await client.get_positions()]
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/invest/orders", response_model=list[OrderRecord])
async def orders(client: AlpacaClient = Depends(get_alpaca_client)) -> list[OrderRecord]:
    try:
        return [_order_record(item) for item in await client.get_orders()]
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


_WINDOW_MAP: dict[str, dict[str, str]] = {
    "1D": {"period": "1D", "timeframe": "5Min"},
    "1W": {"period": "1W", "timeframe": "1H"},
    "1M": {"period": "1M", "timeframe": "1D"},
    "3M": {"period": "3M", "timeframe": "1D"},
    "1Y": {"period": "1A", "timeframe": "1D"},
}


@router.get("/invest/history", response_model=PortfolioHistory)
async def history(
    window: str = Query("1M", alias="range"),
    client: AlpacaClient = Depends(get_alpaca_client),
) -> PortfolioHistory:
    window = window.upper()
    date_start: str | None = None
    if window == "YTD":
        period: str | None = None
        timeframe = "1D"
        date_start = f"{date.today().year}-01-01"
    else:
        config = _WINDOW_MAP.get(window, _WINDOW_MAP["1M"])
        if window not in _WINDOW_MAP:
            window = "1M"
        period = config["period"]
        timeframe = config["timeframe"]
    intraday = timeframe not in ("1D",)
    try:
        data = await client.get_portfolio_history(
            period=period, timeframe=timeframe, date_start=date_start, extended_hours=intraday
        )
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    timestamps = data.get("timestamp") or []
    equities = data.get("equity") or []
    pls = data.get("profit_loss") or []
    points: list[HistoryPoint] = []
    for index, ts in enumerate(timestamps):
        equity = equities[index] if index < len(equities) else None
        if equity is None:
            continue
        points.append(
            HistoryPoint(
                timestamp=int(ts),
                equity=_f(equity),
                profit_loss=_f(pls[index]) if index < len(pls) else 0.0,
            )
        )
    return PortfolioHistory(
        window=window,
        timeframe=str(data.get("timeframe", timeframe)),
        base_value=_f(data.get("base_value")),
        points=points,
    )


@router.post("/invest/orders", response_model=InvestSummary)
async def invest(
    body: InvestRequest,
    user: ProfileData = Depends(get_current_user),
    client: AlpacaClient = Depends(get_alpaca_client),
) -> InvestSummary:
    if not client.configured:
        raise HTTPException(
            status_code=503,
            detail="Investing is not configured. Set ALPACA_API_KEY and ALPACA_SECRET_KEY to enable it.",
        )
    total_weight = sum(weight for weight in body.weights.values() if weight > 0)
    if total_weight <= 0:
        raise HTTPException(status_code=400, detail="Provide at least one positive weight to invest.")

    fee_bps = int(entitlements_for(user.plan).get("trade_fee_bps", 0))
    fee = round(body.amount * fee_bps / 10000, 2)
    investable = body.amount - fee

    results: list[OrderResult] = []
    for symbol, weight in body.weights.items():
        if weight <= 0:
            continue
        ticker = symbol.upper()
        notional = round(investable * (weight / total_weight), 2)
        if notional < 1:
            results.append(
                OrderResult(symbol=ticker, notional=notional, status="skipped", message="Below the $1 minimum order.")
            )
            continue
        try:
            response = await client.submit_notional_order(ticker, notional, side="buy")
            results.append(
                OrderResult(
                    symbol=ticker,
                    notional=notional,
                    status=str(response.get("status", "submitted")),
                    order_id=response.get("id"),
                )
            )
        except InvestError as error:
            results.append(OrderResult(symbol=ticker, notional=notional, status="error", message=error.message))

    invested = round(sum(item.notional for item in results if item.status not in ("skipped", "error")), 2)
    return InvestSummary(
        amount=body.amount,
        fee=fee,
        fee_bps=fee_bps,
        invested=invested,
        plan=user.plan,
        orders=results,
    )


@router.delete("/invest/positions")
async def liquidate(client: AlpacaClient = Depends(get_alpaca_client)) -> dict[str, int]:
    try:
        closed = await client.close_all_positions()
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return {"closed": len(closed)}


@router.delete("/invest/orders")
async def cancel_orders(client: AlpacaClient = Depends(get_alpaca_client)) -> dict[str, int]:
    try:
        canceled = await client.cancel_all_orders()
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return {"canceled": len(canceled)}


@router.delete("/invest/orders/{order_id}")
async def cancel_order(order_id: str, client: AlpacaClient = Depends(get_alpaca_client)) -> dict[str, bool]:
    try:
        await client.cancel_order(order_id)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return {"canceled": True}
