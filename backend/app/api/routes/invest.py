from __future__ import annotations

from datetime import date, timedelta

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_alpaca_client, get_current_user, get_portfolio_repository, get_provider
from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData
from app.data.provider import DataProvider, ProviderError
from app.invest.client import AlpacaClient, InvestError
from app.portfolios.repository import PortfolioRepository
from app.schemas.invest import (
    AccountSummary,
    BenchmarkPoint,
    BenchmarkSeries,
    DriftRow,
    HistoryPoint,
    InvestRequest,
    InvestSummary,
    OrderRecord,
    OrderResult,
    PortfolioHistory,
    Position,
    RebalancePlan,
    RebalanceRequest,
    RebalanceSummary,
    TradeRequest,
)

router = APIRouter(tags=["invest"])

BENCHMARK_SYMBOL = "SPY"
MIN_ORDER_USD = 1.0
TRADING_DAYS = 252


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


_BENCHMARK_DAYS: dict[str, int] = {"1M": 30, "3M": 90, "6M": 182, "1Y": 365}


@router.get("/invest/benchmark", response_model=BenchmarkSeries)
async def benchmark(
    window: str = Query("3M", alias="range"),
    client: AlpacaClient = Depends(get_alpaca_client),
    provider: DataProvider = Depends(get_provider),
) -> BenchmarkSeries:
    window = window.upper()
    if window == "YTD":
        date_start: str | None = f"{date.today().year}-01-01"
        period: str | None = None
    elif window in _BENCHMARK_DAYS:
        date_start = None
        period = "1A" if window == "1Y" else window
    else:
        window = "3M"
        date_start = None
        period = "3M"

    try:
        data = await client.get_portfolio_history(period=period, timeframe="1D", date_start=date_start)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    timestamps = data.get("timestamp") or []
    equities = data.get("equity") or []
    equity = pd.Series(
        [_f(value) for value in equities],
        index=pd.to_datetime([int(ts) for ts in timestamps], unit="s", utc=True).tz_convert(None).normalize(),
    )
    equity = equity[equity > 0]
    equity = equity[~equity.index.duplicated(keep="last")]
    if equity.empty:
        return BenchmarkSeries(
            window=window,
            symbol=BENCHMARK_SYMBOL,
            base_value=0.0,
            portfolio_return=0.0,
            benchmark_return=0.0,
            alpha=0.0,
            tracking_error=0.0,
            points=[],
        )

    start = equity.index[0].date() - timedelta(days=7)
    end = equity.index[-1].date() + timedelta(days=1)
    try:
        prices = await provider.get_prices([BENCHMARK_SYMBOL], start, end)
    except ProviderError as error:
        raise HTTPException(status_code=503, detail=f"Could not load {BENCHMARK_SYMBOL} prices.") from error

    spy = prices.get(BENCHMARK_SYMBOL)
    if spy is None or spy.empty:
        raise HTTPException(status_code=503, detail=f"No {BENCHMARK_SYMBOL} price history is available.")
    spy.index = pd.to_datetime(spy.index).normalize()
    spy = spy[~spy.index.duplicated(keep="last")].sort_index()

    aligned = spy.reindex(spy.index.union(equity.index)).ffill().reindex(equity.index)
    frame = pd.DataFrame({"portfolio": equity, "spy": aligned}).dropna()
    if len(frame) < 2 or frame["spy"].iloc[0] <= 0:
        raise HTTPException(status_code=503, detail="Not enough overlapping history to compare against the index.")

    base = float(frame["portfolio"].iloc[0])
    frame["benchmark"] = base * frame["spy"] / float(frame["spy"].iloc[0])

    portfolio_return = float(frame["portfolio"].iloc[-1] / base - 1.0)
    benchmark_return = float(frame["benchmark"].iloc[-1] / base - 1.0)
    active = frame["portfolio"].pct_change() - frame["benchmark"].pct_change()
    active = active.dropna()
    tracking_error = float(active.std(ddof=1) * np.sqrt(TRADING_DAYS)) if len(active) > 1 else 0.0

    points = [
        BenchmarkPoint(
            timestamp=int(index.timestamp()),
            portfolio=round(float(row.portfolio), 2),
            benchmark=round(float(row.benchmark), 2),
        )
        for index, row in zip(frame.index, frame.itertuples(), strict=True)
    ]
    return BenchmarkSeries(
        window=window,
        symbol=BENCHMARK_SYMBOL,
        base_value=round(base, 2),
        portfolio_return=portfolio_return,
        benchmark_return=benchmark_return,
        alpha=portfolio_return - benchmark_return,
        tracking_error=0.0 if np.isnan(tracking_error) else tracking_error,
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


async def _build_plan(
    portfolio_id: int,
    user: ProfileData,
    client: AlpacaClient,
    portfolios: PortfolioRepository,
) -> RebalancePlan:
    saved = await portfolios.get(user.id, portfolio_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="That portfolio does not exist.")

    try:
        raw_positions = await client.get_positions()
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    held = {str(item.get("symbol", "")).upper(): _f(item.get("market_value")) for item in raw_positions}
    targets = {symbol.upper(): weight for symbol, weight in saved.weights.items() if weight > 0}
    total_weight = sum(targets.values())
    if total_weight <= 0:
        raise HTTPException(status_code=400, detail="That portfolio has no positive weights to target.")
    targets = {symbol: weight / total_weight for symbol, weight in targets.items()}

    total_value = sum(held.values())
    fee_bps = int(entitlements_for(user.plan).get("trade_fee_bps", 0))

    rows: list[DriftRow] = []
    for symbol in sorted(set(held) | set(targets)):
        current_value = held.get(symbol, 0.0)
        target_weight = targets.get(symbol, 0.0)
        target_value = total_value * target_weight
        current_weight = current_value / total_value if total_value > 0 else 0.0
        delta = target_value - current_value
        if abs(delta) < MIN_ORDER_USD:
            action = "hold"
        elif delta > 0:
            action = "buy"
        else:
            action = "sell"
        rows.append(
            DriftRow(
                symbol=symbol,
                current_value=round(current_value, 2),
                current_weight=current_weight,
                target_weight=target_weight,
                target_value=round(target_value, 2),
                delta=round(delta, 2),
                action=action,
            )
        )

    max_drift = max((abs(row.current_weight - row.target_weight) for row in rows), default=0.0)
    buy_total = sum(row.delta for row in rows if row.action == "buy")
    fee = round(buy_total * fee_bps / 10000, 2)
    tradable = any(row.action != "hold" for row in rows)

    message = None
    if total_value <= 0:
        message = "You have no holdings yet, so there is nothing to rebalance. Invest in a portfolio first."
    elif not tradable:
        message = "Your holdings already match this target. No trades needed."

    return RebalancePlan(
        portfolio_id=portfolio_id,
        portfolio_name=saved.name,
        total_value=round(total_value, 2),
        max_drift=max_drift,
        fee=fee,
        fee_bps=fee_bps,
        rows=rows,
        tradable=tradable and total_value > 0,
        message=message,
    )


@router.get("/invest/rebalance", response_model=RebalancePlan)
async def rebalance_preview(
    portfolio_id: int = Query(..., alias="portfolio_id"),
    user: ProfileData = Depends(get_current_user),
    client: AlpacaClient = Depends(get_alpaca_client),
    portfolios: PortfolioRepository = Depends(get_portfolio_repository),
) -> RebalancePlan:
    return await _build_plan(portfolio_id, user, client, portfolios)


@router.post("/invest/rebalance", response_model=RebalanceSummary)
async def rebalance(
    body: RebalanceRequest,
    user: ProfileData = Depends(get_current_user),
    client: AlpacaClient = Depends(get_alpaca_client),
    portfolios: PortfolioRepository = Depends(get_portfolio_repository),
) -> RebalanceSummary:
    plan = await _build_plan(body.portfolio_id, user, client, portfolios)
    if not plan.tradable:
        raise HTTPException(status_code=400, detail=plan.message or "There is nothing to rebalance.")

    sells: list[OrderResult] = []
    for row in plan.rows:
        if row.action != "sell":
            continue
        notional = round(-row.delta, 2)
        if notional < MIN_ORDER_USD:
            continue
        if row.target_weight <= 0:
            try:
                await client.close_position(row.symbol)
                sells.append(OrderResult(symbol=row.symbol, notional=round(row.current_value, 2), status="submitted"))
            except InvestError as error:
                sells.append(
                    OrderResult(
                        symbol=row.symbol,
                        notional=round(row.current_value, 2),
                        status="error",
                        message=error.message,
                    )
                )
            continue
        try:
            response = await client.submit_notional_order(row.symbol, notional, side="sell")
            sells.append(
                OrderResult(
                    symbol=row.symbol,
                    notional=notional,
                    status=str(response.get("status", "submitted")),
                    order_id=response.get("id"),
                )
            )
        except InvestError as error:
            sells.append(OrderResult(symbol=row.symbol, notional=notional, status="error", message=error.message))

    gross_buys = sum(row.delta for row in plan.rows if row.action == "buy")
    scale = 1.0
    if gross_buys > 0 and plan.fee > 0:
        scale = max((gross_buys - plan.fee) / gross_buys, 0.0)

    buys: list[OrderResult] = []
    for row in plan.rows:
        if row.action != "buy":
            continue
        notional = round(row.delta * scale, 2)
        if notional < MIN_ORDER_USD:
            buys.append(
                OrderResult(
                    symbol=row.symbol,
                    notional=notional,
                    status="skipped",
                    message="Below the $1 minimum order.",
                )
            )
            continue
        try:
            response = await client.submit_notional_order(row.symbol, notional, side="buy")
            buys.append(
                OrderResult(
                    symbol=row.symbol,
                    notional=notional,
                    status=str(response.get("status", "submitted")),
                    order_id=response.get("id"),
                )
            )
        except InvestError as error:
            buys.append(OrderResult(symbol=row.symbol, notional=notional, status="error", message=error.message))

    return RebalanceSummary(sells=sells, buys=buys, fee=plan.fee)


@router.post("/invest/trade", response_model=OrderResult)
async def trade(
    body: TradeRequest,
    user: ProfileData = Depends(get_current_user),
    client: AlpacaClient = Depends(get_alpaca_client),
) -> OrderResult:
    symbol = body.symbol.strip().upper()
    notional = round(body.notional, 2)
    fee = 0.0
    if body.side == "buy":
        fee_bps = int(entitlements_for(user.plan).get("trade_fee_bps", 0))
        fee = round(notional * fee_bps / 10000, 2)
        notional = round(notional - fee, 2)
    if notional < MIN_ORDER_USD:
        raise HTTPException(status_code=400, detail="That leaves less than the $1 minimum order.")
    try:
        response = await client.submit_notional_order(symbol, notional, side=body.side)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return OrderResult(
        symbol=symbol,
        notional=notional,
        status=str(response.get("status", "submitted")),
        order_id=response.get("id"),
        message=f"Fee of ${fee:.2f} applied." if fee > 0 else None,
    )


@router.delete("/invest/positions/{symbol}", response_model=OrderResult)
async def close_position(
    symbol: str,
    percentage: float | None = Query(None, gt=0, le=100),
    client: AlpacaClient = Depends(get_alpaca_client),
) -> OrderResult:
    ticker = symbol.strip().upper()
    try:
        response = await client.close_position(ticker, percentage)
    except InvestError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    data = response if isinstance(response, dict) else {}
    return OrderResult(
        symbol=ticker,
        notional=0.0,
        status=str(data.get("status", "submitted")),
        order_id=data.get("id"),
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
