from __future__ import annotations

from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd
from sqlalchemy import delete as sql_delete
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData
from app.data.provider import DataProvider
from app.db.models import InvestAccount, InvestEquityPoint, InvestOrder, InvestPosition
from app.invest.client import InvestError
from app.invest.market import is_market_open, next_market_open, utcnow
from app.schemas.invest import (
    AccountSummary,
    BenchmarkPoint,
    BenchmarkSeries,
    DriftRow,
    HistoryPoint,
    InvestSummary,
    OrderRecord,
    OrderResult,
    PortfolioHistory,
    Position,
    RebalancePlan,
    RebalanceSummary,
)

STARTING_BALANCE = 100_000.0
MIN_ORDER_USD = 1.0
BENCHMARK_SYMBOL = "SPY"
TRADING_DAYS = 252

_WINDOW_DAYS: dict[str, int] = {"1D": 1, "1W": 7, "1M": 30, "3M": 90, "6M": 182, "1Y": 365}
_WINDOW_TIMEFRAME: dict[str, str] = {"1D": "5Min", "1W": "1H", "1M": "1D", "3M": "1D", "6M": "1D", "1Y": "1D"}


class InvestSimulator:
    """A per-user paper-trading ledger backed by our own database.

    Cash, positions, orders and an equity history are kept per user id. Orders fill
    at the latest available market price when the market is open, and otherwise wait
    until the next open, settled lazily on the next request.
    """

    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession],
        provider: DataProvider,
    ) -> None:
        self._session_factory = session_factory
        self._provider = provider

    async def _latest_prices(self, symbols: set[str]) -> dict[str, float]:
        wanted = sorted({symbol.upper() for symbol in symbols if symbol})
        if not wanted:
            return {}
        end = date.today() + timedelta(days=1)
        start = end - timedelta(days=20)
        data = await self._provider.get_prices(wanted, start, end)
        prices: dict[str, float] = {}
        for symbol in wanted:
            series = data.get(symbol)
            if series is None:
                continue
            clean = series.dropna()
            if not clean.empty:
                prices[symbol] = float(clean.iloc[-1])
        return prices

    async def _get_or_create(self, session: AsyncSession, user_id: str) -> InvestAccount:
        account = await session.get(InvestAccount, user_id)
        if account is None:
            account = InvestAccount(user_id=user_id, cash=STARTING_BALANCE, starting_balance=STARTING_BALANCE)
            session.add(account)
        return account

    async def _prepare(
        self, session: AsyncSession, user_id: str, extra_symbols: list[str], now: datetime
    ) -> tuple[InvestAccount, dict[str, InvestPosition], dict[str, float]]:
        account = await self._get_or_create(session, user_id)
        positions = (
            (await session.execute(select(InvestPosition).where(InvestPosition.user_id == user_id))).scalars().all()
        )
        positions_map = {position.symbol: position for position in positions}
        due = (
            (
                await session.execute(
                    select(InvestOrder)
                    .where(
                        InvestOrder.user_id == user_id,
                        InvestOrder.status == "new",
                        InvestOrder.fill_at.is_not(None),
                        InvestOrder.fill_at <= now,
                    )
                    .order_by(InvestOrder.submitted_at, InvestOrder.id)
                )
            )
            .scalars()
            .all()
        )
        symbols = set(positions_map) | {order.symbol for order in due} | {s.upper() for s in extra_symbols}
        prices = await self._latest_prices(symbols)
        for order in due:
            price = prices.get(order.symbol)
            if price is not None and price > 0:
                self._fill(session, account, positions_map, order, price, now)
        return account, positions_map, prices

    def _fill(
        self,
        session: AsyncSession,
        account: InvestAccount,
        positions_map: dict[str, InvestPosition],
        order: InvestOrder,
        price: float,
        now: datetime,
    ) -> None:
        symbol = order.symbol
        if order.side == "buy":
            net = order.notional or 0.0
            cost = round(net + (order.fee or 0.0), 6)
            if account.cash + 1e-6 < cost:
                order.status = "rejected"
                return
            shares = net / price if price > 0 else 0.0
            account.cash = round(account.cash - cost, 6)
            position = positions_map.get(symbol)
            if position is None:
                position = InvestPosition(user_id=order.user_id, symbol=symbol, qty=0.0, cost_basis=0.0)
                session.add(position)
                positions_map[symbol] = position
            position.qty = round(position.qty + shares, 10)
            position.cost_basis = round(position.cost_basis + net, 6)
            order.filled_qty = shares
        else:
            position = positions_map.get(symbol)
            available = position.qty if position else 0.0
            sell_qty = min(order.qty or 0.0, available)
            if position is None or sell_qty <= 1e-9:
                order.status = "rejected"
                return
            proceeds = round(sell_qty * price, 6)
            cost_removed = round(position.cost_basis * (sell_qty / position.qty), 6) if position.qty > 0 else 0.0
            position.qty = round(position.qty - sell_qty, 10)
            position.cost_basis = round(position.cost_basis - cost_removed, 6)
            account.cash = round(account.cash + proceeds, 6)
            order.filled_qty = sell_qty
            if position.qty <= 1e-9:
                session.delete(position)
                positions_map.pop(symbol, None)
        order.status = "filled"
        order.filled_at = now
        order.filled_avg_price = price

    def _place(
        self,
        session: AsyncSession,
        account: InvestAccount,
        positions_map: dict[str, InvestPosition],
        *,
        user_id: str,
        symbol: str,
        side: str,
        notional: float | None,
        qty: float | None,
        fee: float,
        price: float,
        now: datetime,
        market_open: bool,
        next_open: datetime,
    ) -> InvestOrder:
        order = InvestOrder(
            user_id=user_id,
            symbol=symbol,
            side=side,
            notional=notional,
            qty=qty,
            fee=fee,
            status="new",
            submitted_at=now,
        )
        session.add(order)
        if market_open:
            self._fill(session, account, positions_map, order, price, now)
        else:
            order.fill_at = next_open
        return order

    def _market_value(self, positions_map: dict[str, InvestPosition], prices: dict[str, float]) -> float:
        return sum(position.qty * prices.get(symbol, 0.0) for symbol, position in positions_map.items())

    def _equity(
        self, account: InvestAccount, positions_map: dict[str, InvestPosition], prices: dict[str, float]
    ) -> float:
        return account.cash + self._market_value(positions_map, prices)

    def _record_equity(
        self,
        session: AsyncSession,
        user_id: str,
        account: InvestAccount,
        positions_map: dict[str, InvestPosition],
        prices: dict[str, float],
        now: datetime,
    ) -> None:
        equity = round(self._equity(account, positions_map, prices), 2)
        session.add(InvestEquityPoint(user_id=user_id, ts=now, equity=equity))

    async def account(self, user: ProfileData) -> AccountSummary:
        now = utcnow()
        async with self._session_factory() as session:
            account, positions_map, prices = await self._prepare(session, user.id, [], now)
            market_value = self._market_value(positions_map, prices)
            cash = account.cash
            await session.commit()
        equity = cash + market_value
        return AccountSummary(
            status="ACTIVE",
            currency="USD",
            cash=round(cash, 2),
            equity=round(equity, 2),
            portfolio_value=round(equity, 2),
            buying_power=round(cash, 2),
            long_market_value=round(market_value, 2),
            configured=True,
        )

    async def positions(self, user: ProfileData) -> list[Position]:
        now = utcnow()
        async with self._session_factory() as session:
            _, positions_map, prices = await self._prepare(session, user.id, [], now)
            rows = []
            for symbol, position in sorted(positions_map.items()):
                price = prices.get(symbol, 0.0)
                market_value = position.qty * price
                cost_basis = position.cost_basis
                unrealized = market_value - cost_basis
                rows.append(
                    Position(
                        symbol=symbol,
                        qty=round(position.qty, 6),
                        avg_entry_price=round(cost_basis / position.qty, 4) if position.qty > 0 else 0.0,
                        current_price=round(price, 4),
                        market_value=round(market_value, 2),
                        cost_basis=round(cost_basis, 2),
                        unrealized_pl=round(unrealized, 2),
                        unrealized_plpc=round(unrealized / cost_basis, 6) if cost_basis > 0 else 0.0,
                        change_today=0.0,
                    )
                )
            await session.commit()
        return rows

    async def orders(self, user: ProfileData) -> list[OrderRecord]:
        now = utcnow()
        async with self._session_factory() as session:
            await self._prepare(session, user.id, [], now)
            await session.commit()
            result = await session.execute(
                select(InvestOrder)
                .where(InvestOrder.user_id == user.id)
                .order_by(desc(InvestOrder.submitted_at), desc(InvestOrder.id))
                .limit(50)
            )
            records = [
                OrderRecord(
                    id=str(order.id),
                    symbol=order.symbol,
                    side=order.side,
                    notional=round(order.notional, 2) if order.notional is not None else None,
                    qty=round(order.qty, 6) if order.qty is not None else None,
                    filled_qty=round(order.filled_qty, 6) if order.filled_qty is not None else None,
                    status=order.status,
                    submitted_at=order.submitted_at.isoformat() if order.submitted_at else None,
                    filled_avg_price=round(order.filled_avg_price, 4) if order.filled_avg_price is not None else None,
                )
                for order in result.scalars().all()
            ]
        return records

    async def invest(self, user: ProfileData, weights: dict[str, float], amount: float) -> InvestSummary:
        total_weight = sum(weight for weight in weights.values() if weight > 0)
        if total_weight <= 0:
            raise InvestError("Provide at least one positive weight to invest.", 400)
        fee_bps = int(entitlements_for(user.plan).get("trade_fee_bps", 0))
        fee = round(amount * fee_bps / 10000, 2)
        investable = amount - fee

        now = utcnow()
        market_open = is_market_open(now)
        next_open = next_market_open(now)
        symbols = [symbol.upper() for symbol, weight in weights.items() if weight > 0]

        results: list[OrderResult] = []
        async with self._session_factory() as session:
            account, positions_map, prices = await self._prepare(session, user.id, symbols, now)
            if amount > account.cash + 1e-6:
                raise InvestError(f"Not enough cash. You have ${account.cash:,.2f} available.", 400)
            for symbol, weight in weights.items():
                if weight <= 0:
                    continue
                ticker = symbol.upper()
                net = round(investable * (weight / total_weight), 2)
                fee_i = round(fee * (weight / total_weight), 2)
                if net < MIN_ORDER_USD:
                    results.append(
                        OrderResult(symbol=ticker, notional=net, status="skipped", message="Below the $1 minimum order.")
                    )
                    continue
                price = prices.get(ticker)
                if price is None or price <= 0:
                    results.append(
                        OrderResult(symbol=ticker, notional=net, status="error", message="No market price available.")
                    )
                    continue
                order = self._place(
                    session,
                    account,
                    positions_map,
                    user_id=user.id,
                    symbol=ticker,
                    side="buy",
                    notional=net,
                    qty=None,
                    fee=fee_i,
                    price=price,
                    now=now,
                    market_open=market_open,
                    next_open=next_open,
                )
                results.append(OrderResult(symbol=ticker, notional=net, status=order.status))
            self._record_equity(session, user.id, account, positions_map, prices, now)
            await session.commit()

        invested = round(
            sum(item.notional for item in results if item.status not in ("skipped", "error", "rejected")), 2
        )
        return InvestSummary(amount=amount, fee=fee, fee_bps=fee_bps, invested=invested, plan=user.plan, orders=results)

    async def trade(self, user: ProfileData, symbol: str, side: str, notional: float) -> OrderResult:
        symbol = symbol.strip().upper()
        notional = round(notional, 2)
        fee = 0.0
        net = notional
        if side == "buy":
            fee_bps = int(entitlements_for(user.plan).get("trade_fee_bps", 0))
            fee = round(notional * fee_bps / 10000, 2)
            net = round(notional - fee, 2)
        if net < MIN_ORDER_USD:
            raise InvestError("That leaves less than the $1 minimum order.", 400)

        now = utcnow()
        market_open = is_market_open(now)
        next_open = next_market_open(now)
        async with self._session_factory() as session:
            account, positions_map, prices = await self._prepare(session, user.id, [symbol], now)
            price = prices.get(symbol)
            if price is None or price <= 0:
                raise InvestError(f"No market price available for {symbol}.", 503)
            if side == "buy":
                if net + fee > account.cash + 1e-6:
                    raise InvestError(f"Not enough cash. You have ${account.cash:,.2f} available.", 400)
                order = self._place(
                    session,
                    account,
                    positions_map,
                    user_id=user.id,
                    symbol=symbol,
                    side="buy",
                    notional=net,
                    qty=None,
                    fee=fee,
                    price=price,
                    now=now,
                    market_open=market_open,
                    next_open=next_open,
                )
            else:
                position = positions_map.get(symbol)
                if position is None or position.qty <= 0:
                    raise InvestError(f"You have no {symbol} to sell.", 400)
                sell_qty = min(net / price, position.qty)
                order = self._place(
                    session,
                    account,
                    positions_map,
                    user_id=user.id,
                    symbol=symbol,
                    side="sell",
                    notional=round(sell_qty * price, 2),
                    qty=sell_qty,
                    fee=0.0,
                    price=price,
                    now=now,
                    market_open=market_open,
                    next_open=next_open,
                )
            status = order.status
            self._record_equity(session, user.id, account, positions_map, prices, now)
            await session.commit()

        return OrderResult(
            symbol=symbol,
            notional=net,
            status=status,
            message=f"Fee of ${fee:.2f} applied." if fee > 0 else None,
        )

    async def close_position(self, user: ProfileData, symbol: str, percentage: float | None) -> OrderResult:
        symbol = symbol.strip().upper()
        now = utcnow()
        market_open = is_market_open(now)
        next_open = next_market_open(now)
        async with self._session_factory() as session:
            account, positions_map, prices = await self._prepare(session, user.id, [symbol], now)
            position = positions_map.get(symbol)
            if position is None or position.qty <= 0:
                raise InvestError(f"You have no {symbol} to close.", 400)
            price = prices.get(symbol)
            if price is None or price <= 0:
                raise InvestError(f"No market price available for {symbol}.", 503)
            fraction = (percentage if percentage is not None else 100.0) / 100.0
            sell_qty = position.qty * fraction
            order = self._place(
                session,
                account,
                positions_map,
                user_id=user.id,
                symbol=symbol,
                side="sell",
                notional=round(sell_qty * price, 2),
                qty=sell_qty,
                fee=0.0,
                price=price,
                now=now,
                market_open=market_open,
                next_open=next_open,
            )
            status = order.status
            self._record_equity(session, user.id, account, positions_map, prices, now)
            await session.commit()
        return OrderResult(symbol=symbol, notional=round(sell_qty * price, 2), status=status)

    async def reset(self, user: ProfileData) -> int:
        now = utcnow()
        async with self._session_factory() as session:
            account = await self._get_or_create(session, user.id)
            count = (
                await session.execute(select(InvestPosition).where(InvestPosition.user_id == user.id))
            ).scalars().all()
            cleared = len(count)
            await session.execute(sql_delete(InvestPosition).where(InvestPosition.user_id == user.id))
            await session.execute(sql_delete(InvestOrder).where(InvestOrder.user_id == user.id))
            await session.execute(sql_delete(InvestEquityPoint).where(InvestEquityPoint.user_id == user.id))
            account.cash = account.starting_balance
            session.add(InvestEquityPoint(user_id=user.id, ts=now, equity=round(account.starting_balance, 2)))
            await session.commit()
        return cleared

    async def cancel_all(self, user: ProfileData) -> int:
        now = utcnow()
        async with self._session_factory() as session:
            await self._prepare(session, user.id, [], now)
            pending = (
                await session.execute(
                    select(InvestOrder).where(InvestOrder.user_id == user.id, InvestOrder.status == "new")
                )
            ).scalars().all()
            for order in pending:
                order.status = "canceled"
            await session.commit()
        return len(pending)

    async def cancel_one(self, user: ProfileData, order_id: str) -> bool:
        try:
            oid = int(order_id)
        except (TypeError, ValueError):
            return False
        now = utcnow()
        async with self._session_factory() as session:
            await self._prepare(session, user.id, [], now)
            order = await session.get(InvestOrder, oid)
            if order is None or order.user_id != user.id or order.status != "new":
                await session.commit()
                return False
            order.status = "canceled"
            await session.commit()
        return True

    async def _drift_rows(
        self, positions_map: dict[str, InvestPosition], prices: dict[str, float], targets: dict[str, float]
    ) -> tuple[list[DriftRow], float]:
        held = {symbol: position.qty * prices.get(symbol, 0.0) for symbol, position in positions_map.items()}
        total_value = sum(held.values())
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
        return rows, total_value

    async def rebalance_plan(self, user: ProfileData, saved) -> RebalancePlan:
        now = utcnow()
        targets = {symbol.upper(): weight for symbol, weight in saved.weights.items() if weight > 0}
        total_weight = sum(targets.values())
        if total_weight <= 0:
            raise InvestError("That portfolio has no positive weights to target.", 400)
        targets = {symbol: weight / total_weight for symbol, weight in targets.items()}
        async with self._session_factory() as session:
            _, positions_map, prices = await self._prepare(session, user.id, list(targets), now)
            rows, total_value = await self._drift_rows(positions_map, prices, targets)
            await session.commit()
        return self._plan_from_rows(user, saved, rows, total_value)

    def _plan_from_rows(self, user: ProfileData, saved, rows: list[DriftRow], total_value: float) -> RebalancePlan:
        max_drift = max((abs(row.current_weight - row.target_weight) for row in rows), default=0.0)
        buy_total = sum(row.delta for row in rows if row.action == "buy")
        fee_bps = int(entitlements_for(user.plan).get("trade_fee_bps", 0))
        fee = round(buy_total * fee_bps / 10000, 2)
        tradable = any(row.action != "hold" for row in rows)
        message = None
        if total_value <= 0:
            message = "You have no holdings yet, so there is nothing to rebalance. Invest in a portfolio first."
        elif not tradable:
            message = "Your holdings already match this target. No trades needed."
        return RebalancePlan(
            portfolio_id=saved.id,
            portfolio_name=saved.name,
            total_value=round(total_value, 2),
            max_drift=max_drift,
            fee=fee,
            fee_bps=fee_bps,
            rows=rows,
            tradable=tradable and total_value > 0,
            message=message,
        )

    async def rebalance(self, user: ProfileData, saved) -> RebalanceSummary:
        now = utcnow()
        market_open = is_market_open(now)
        next_open = next_market_open(now)
        targets = {symbol.upper(): weight for symbol, weight in saved.weights.items() if weight > 0}
        total_weight = sum(targets.values())
        if total_weight <= 0:
            raise InvestError("That portfolio has no positive weights to target.", 400)
        targets = {symbol: weight / total_weight for symbol, weight in targets.items()}

        fee_bps = int(entitlements_for(user.plan).get("trade_fee_bps", 0))
        sells: list[OrderResult] = []
        buys: list[OrderResult] = []
        async with self._session_factory() as session:
            account, positions_map, prices = await self._prepare(session, user.id, list(targets), now)
            rows, total_value = await self._drift_rows(positions_map, prices, targets)
            if total_value <= 0 or not any(row.action != "hold" for row in rows):
                raise InvestError("There is nothing to rebalance.", 400)

            for row in rows:
                if row.action != "sell":
                    continue
                position = positions_map.get(row.symbol)
                price = prices.get(row.symbol)
                if position is None or price is None or price <= 0:
                    continue
                if row.target_weight <= 0:
                    sell_qty = position.qty
                else:
                    sell_qty = min(-row.delta / price, position.qty)
                if sell_qty <= 1e-9:
                    continue
                order = self._place(
                    session,
                    account,
                    positions_map,
                    user_id=user.id,
                    symbol=row.symbol,
                    side="sell",
                    notional=round(sell_qty * price, 2),
                    qty=sell_qty,
                    fee=0.0,
                    price=price,
                    now=now,
                    market_open=market_open,
                    next_open=next_open,
                )
                sells.append(OrderResult(symbol=row.symbol, notional=round(sell_qty * price, 2), status=order.status))

            gross_buys = sum(row.delta for row in rows if row.action == "buy")
            fee = round(gross_buys * fee_bps / 10000, 2)
            scale = 1.0
            if gross_buys > 0 and fee > 0:
                scale = max((gross_buys - fee) / gross_buys, 0.0)

            for row in rows:
                if row.action != "buy":
                    continue
                net = round(row.delta * scale, 2)
                fee_i = round(row.delta * scale * fee_bps / 10000, 2)
                if net < MIN_ORDER_USD:
                    buys.append(
                        OrderResult(symbol=row.symbol, notional=net, status="skipped", message="Below the $1 minimum order.")
                    )
                    continue
                price = prices.get(row.symbol)
                if price is None or price <= 0:
                    buys.append(OrderResult(symbol=row.symbol, notional=net, status="error", message="No market price available."))
                    continue
                order = self._place(
                    session,
                    account,
                    positions_map,
                    user_id=user.id,
                    symbol=row.symbol,
                    side="buy",
                    notional=net,
                    qty=None,
                    fee=fee_i,
                    price=price,
                    now=now,
                    market_open=market_open,
                    next_open=next_open,
                )
                buys.append(OrderResult(symbol=row.symbol, notional=net, status=order.status))

            self._record_equity(session, user.id, account, positions_map, prices, now)
            await session.commit()

        return RebalanceSummary(sells=sells, buys=buys, fee=fee)

    async def history(self, user: ProfileData, window: str) -> PortfolioHistory:
        window = window.upper()
        now = utcnow()
        if window == "YTD":
            since = datetime(now.year, 1, 1)
            timeframe = "1D"
        else:
            days = _WINDOW_DAYS.get(window, 30)
            if window not in _WINDOW_DAYS:
                window = "1M"
            since = now - timedelta(days=days)
            timeframe = _WINDOW_TIMEFRAME.get(window, "1D")
        async with self._session_factory() as session:
            account, positions_map, prices = await self._prepare(session, user.id, [], now)
            current_equity = round(self._equity(account, positions_map, prices), 2)
            created_at = account.created_at.replace(tzinfo=None) if account.created_at else now
            stored = (
                await session.execute(
                    select(InvestEquityPoint)
                    .where(InvestEquityPoint.user_id == user.id, InvestEquityPoint.ts >= since)
                    .order_by(InvestEquityPoint.ts)
                )
            ).scalars().all()
            await session.commit()

        points: list[HistoryPoint] = []
        base_ts = max(since, created_at)
        base_value = account.starting_balance
        if stored:
            base_value = stored[0].equity
        points.append(HistoryPoint(timestamp=int(base_ts.timestamp()), equity=round(base_value, 2), profit_loss=0.0))
        for point in stored:
            points.append(
                HistoryPoint(
                    timestamp=int(point.ts.timestamp()),
                    equity=round(point.equity, 2),
                    profit_loss=round(point.equity - base_value, 2),
                )
            )
        points.append(
            HistoryPoint(
                timestamp=int(now.timestamp()),
                equity=current_equity,
                profit_loss=round(current_equity - base_value, 2),
            )
        )
        return PortfolioHistory(window=window, timeframe=timeframe, base_value=round(base_value, 2), points=points)

    async def benchmark(self, user: ProfileData, window: str, provider: DataProvider) -> BenchmarkSeries:
        window = window.upper()
        now = utcnow()
        if window == "YTD":
            since = datetime(now.year, 1, 1)
        else:
            if window not in _WINDOW_DAYS:
                window = "3M"
            since = now - timedelta(days=_WINDOW_DAYS.get(window, 90))

        async with self._session_factory() as session:
            account, positions_map, prices = await self._prepare(session, user.id, [], now)
            current_equity = round(self._equity(account, positions_map, prices), 2)
            stored = (
                await session.execute(
                    select(InvestEquityPoint)
                    .where(InvestEquityPoint.user_id == user.id, InvestEquityPoint.ts >= since)
                    .order_by(InvestEquityPoint.ts)
                )
            ).scalars().all()
            starting_balance = account.starting_balance
            await session.commit()

        series_points = [(point.ts, point.equity) for point in stored]
        series_points.append((now, current_equity))
        equity = pd.Series(
            [value for _, value in series_points],
            index=pd.to_datetime([ts for ts, _ in series_points]).normalize(),
        )
        equity = equity[~equity.index.duplicated(keep="last")].sort_index()
        if len(equity) < 2:
            equity = pd.Series(
                [starting_balance, current_equity],
                index=pd.to_datetime([since, now]).normalize(),
            )
            equity = equity[~equity.index.duplicated(keep="last")].sort_index()

        empty = BenchmarkSeries(
            window=window,
            symbol=BENCHMARK_SYMBOL,
            base_value=round(starting_balance, 2),
            portfolio_return=0.0,
            benchmark_return=0.0,
            alpha=0.0,
            tracking_error=0.0,
            points=[],
        )
        if equity.empty:
            return empty

        start = equity.index[0].date() - timedelta(days=7)
        end = equity.index[-1].date() + timedelta(days=1)
        prices_frame = await provider.get_prices([BENCHMARK_SYMBOL], start, end)
        spy = prices_frame.get(BENCHMARK_SYMBOL)
        if spy is None or spy.empty:
            return empty
        spy.index = pd.to_datetime(spy.index).normalize()
        spy = spy[~spy.index.duplicated(keep="last")].sort_index()

        full_index = spy.index.union(equity.index)
        aligned_spy = spy.reindex(full_index).ffill().reindex(equity.index)
        aligned_equity = equity.reindex(full_index).ffill().reindex(equity.index)
        frame = pd.DataFrame({"portfolio": aligned_equity, "spy": aligned_spy}).dropna()
        if len(frame) < 2 or frame["spy"].iloc[0] <= 0:
            return empty

        base = float(frame["portfolio"].iloc[0])
        frame["benchmark"] = base * frame["spy"] / float(frame["spy"].iloc[0])
        portfolio_return = float(frame["portfolio"].iloc[-1] / base - 1.0)
        benchmark_return = float(frame["benchmark"].iloc[-1] / base - 1.0)
        active = (frame["portfolio"].pct_change() - frame["benchmark"].pct_change()).dropna()
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
