from datetime import date, timedelta

import pandas as pd

from app.backtest.analytics import performance_stats
from app.backtest.strategies import make_optimizer_strategy
from app.behavioral.simulator import BehaviorPolicy, BehavioralError, PolicyPath, simulate
from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import build_price_frame
from app.schemas.behavioral import (
    BehaviorGapRequest,
    BehaviorGapResponse,
    BiasDriver,
    CurvePoint,
    PolicyResult,
    PolicyStats,
    ToleranceCheck,
)

_CADENCE = {"monthly": 21, "quarterly": 63, "annual": 252}

_OVERTRADE_CADENCE = 5
_CONCENTRATION_MAX_WEIGHT = 0.70
_DEFAULT_PANIC_SELL_FRACTION = 0.7
_DEFAULT_REENTER_DAYS = 126


def _curve(path: PolicyPath, initial: float, max_points: int = 240) -> list[CurvePoint]:
    total = len(path.dates)
    stride = max(1, total // max_points)
    points = [
        CurvePoint(date=path.dates[i], value=initial * path.equity[i], drawdown=path.drawdown[i])
        for i in range(0, total, stride)
    ]
    last = total - 1
    if points and points[-1].date != path.dates[last]:
        points.append(CurvePoint(date=path.dates[last], value=initial * path.equity[last], drawdown=path.drawdown[last]))
    return points


def _stats(path: PolicyPath, settings: Settings, risk_free_rate: float, initial: float) -> PolicyStats:
    returns = pd.Series(path.returns)
    performance = performance_stats(returns, settings.trading_days, risk_free_rate)
    return PolicyStats(
        final_value=initial * path.equity[-1],
        total_return=performance.total_return,
        cagr=performance.cagr,
        volatility=performance.annual_volatility,
        sharpe_ratio=performance.sharpe_ratio,
        max_drawdown=performance.max_drawdown,
        total_cost=path.total_cost,
        total_turnover=path.total_turnover,
        rebalances=path.rebalance_count,
        panic_sales=len(path.panic_dates),
        days_derisked=path.days_derisked,
    )


def _tolerance_check(path: PolicyPath, tolerance: float | None) -> ToleranceCheck | None:
    if tolerance is None or tolerance <= 0:
        return None
    breaches = 0
    inside = True
    worst = 0.0
    first: date | None = None
    for day, drawdown in zip(path.dates, path.drawdown, strict=True):
        worst = min(worst, drawdown)
        if drawdown <= -tolerance:
            if inside:
                breaches += 1
                inside = False
                if first is None:
                    first = day
        elif drawdown > -tolerance * 0.5:
            inside = True
    return ToleranceCheck(
        stated_tolerance=tolerance,
        worst_drawdown=worst,
        breaches=breaches,
        first_breach=first,
    )


def _drivers(request: BehaviorGapRequest) -> list[BiasDriver]:
    drivers: list[BiasDriver] = []
    if request.loss_aversion:
        drivers.append(
            BiasDriver(
                bias="lossAversion",
                behavior=(
                    f"Sells {int(_DEFAULT_PANIC_SELL_FRACTION * 100)}% of the portfolio whenever it falls "
                    f"{int(request.panic_drawdown * 100)}% below its peak, then waits about six months to buy back in."
                ),
            )
        )
    if request.overconfidence:
        drivers.append(
            BiasDriver(
                bias="overconfidence",
                behavior=(
                    f"Concentrates up to {int(_CONCENTRATION_MAX_WEIGHT * 100)}% in a single position and rebalances "
                    "every week instead of on schedule, paying the trading costs each time."
                ),
            )
        )
    if request.anchoring:
        drivers.append(
            BiasDriver(
                bias="anchoring",
                behavior=(
                    "Judges every holding against what it paid. It refuses to sell anything trading below its "
                    "purchase price, and takes profits early by halving any position up more than 25%."
                ),
            )
        )
    return drivers


async def run_behavior_gap(
    request: BehaviorGapRequest, provider: DataProvider, settings: Settings
) -> BehaviorGapResponse:
    end = request.end or date.today()
    history = request.history_days or settings.backtest_history_days
    start = request.start or end - timedelta(days=history)
    if start >= end:
        raise BehavioralError("Start date must be before end date.", 400)

    prices = await provider.get_prices(request.tickers, start, end)
    frame = build_price_frame(prices, settings.min_observations)
    tickers = [ticker for ticker in request.tickers if ticker in frame.columns]
    if len(tickers) < 2:
        raise BehavioralError("Not enough of the selected tickers returned overlapping price history.")
    frame = frame[tickers]

    risk_free_rate = request.risk_free_rate if request.risk_free_rate is not None else settings.risk_free_rate
    cadence = _CADENCE[request.rebalance]
    lookback = request.estimation_window

    disciplined_max_weight = request.max_weight
    behavioral_max_weight = _CONCENTRATION_MAX_WEIGHT if request.overconfidence else request.max_weight

    def strategy(max_weight: float):
        return make_optimizer_strategy(
            tickers,
            request.objective,
            request.risk_model,
            request.ewma_lambda,
            0.0,
            max_weight,
            risk_free_rate,
            settings.trading_days,
        )

    disciplined_policy = BehaviorPolicy(rebalance_every=cadence)
    behavioral_policy = BehaviorPolicy(
        rebalance_every=_OVERTRADE_CADENCE if request.overconfidence else cadence,
        panic_drawdown=request.panic_drawdown if request.loss_aversion else None,
        panic_sell_fraction=_DEFAULT_PANIC_SELL_FRACTION if request.loss_aversion else 0.0,
        reenter_after_days=_DEFAULT_REENTER_DAYS if request.loss_aversion else 0,
        disposition=request.anchoring,
    )

    common = dict(
        lookback=lookback,
        cost_bps=request.cost_bps,
        risk_free_rate=risk_free_rate,
        trading_days=settings.trading_days,
    )
    disciplined = simulate(frame, strategy(disciplined_max_weight), disciplined_policy, **common)
    behavioral = simulate(frame, strategy(behavioral_max_weight), behavioral_policy, **common)

    disciplined_stats = _stats(disciplined, settings, risk_free_rate, request.initial)
    behavioral_stats = _stats(behavioral, settings, risk_free_rate, request.initial)

    gap_value = disciplined_stats.final_value - behavioral_stats.final_value
    gap_pct = gap_value / disciplined_stats.final_value if disciplined_stats.final_value else 0.0

    return BehaviorGapResponse(
        start=disciplined.dates[0],
        end=disciplined.dates[-1],
        initial=request.initial,
        tickers=tickers,
        disciplined=PolicyResult(
            name="Disciplined",
            stats=disciplined_stats,
            curve=_curve(disciplined, request.initial),
            panic_dates=disciplined.panic_dates,
        ),
        behavioral=PolicyResult(
            name="Your instincts",
            stats=behavioral_stats,
            curve=_curve(behavioral, request.initial),
            panic_dates=behavioral.panic_dates,
        ),
        gap_value=gap_value,
        gap_pct=gap_pct,
        cagr_gap=disciplined_stats.cagr - behavioral_stats.cagr,
        drivers=_drivers(request),
        tolerance=_tolerance_check(disciplined, request.panic_drawdown),
    )
