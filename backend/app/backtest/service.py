from datetime import date, timedelta

import pandas as pd

from app.backtest.analytics import performance_stats, relative_stats, rolling_sharpe
from app.backtest.engine import BacktestError, BacktestPath, run_walk_forward
from app.backtest.strategies import (
    BOND_TICKER,
    INDEX_TICKER,
    equal_weight_strategy,
    make_optimizer_strategy,
    static_strategy,
)
from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import build_price_frame
from app.schemas.backtest import (
    BacktestRequest,
    BacktestResponse,
    CurvePoint,
    RelativeStatsSchema,
    RollingPoint,
    StrategyResult,
    StrategyStats,
)

_CADENCE = {"monthly": 21, "quarterly": 63, "annual": 252}
_ROLLING_WINDOW = 63
_INDEX_NAME = "Index (SPY)"


class BacktestServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def run_backtest(request: BacktestRequest, provider: DataProvider, settings: Settings) -> BacktestResponse:
    end = request.end or date.today()
    history = request.history_days or settings.backtest_history_days
    start = request.start or end - timedelta(days=history)
    if start >= end:
        raise BacktestServiceError("Start date must be before end date.")

    universe = list(dict.fromkeys(request.tickers + [INDEX_TICKER, BOND_TICKER]))
    prices = await provider.get_prices(universe, start, end)
    frame = build_price_frame(prices, settings.min_observations)

    strategy_tickers = [ticker for ticker in request.tickers if ticker in frame.columns]
    if len(strategy_tickers) < 2:
        raise BacktestServiceError("Not enough of the selected tickers returned overlapping price history.", 422)

    rebalance_every = _CADENCE[request.rebalance]
    lookback = request.estimation_window
    if frame.shape[0] <= lookback + rebalance_every:
        raise BacktestServiceError("Not enough price history for the chosen estimation window and cadence.", 422)

    risk_free_rate = request.risk_free_rate if request.risk_free_rate is not None else settings.risk_free_rate

    def _run(weight_fn, *, with_turnover: bool) -> BacktestPath:
        return run_walk_forward(
            frame,
            weight_fn,
            lookback=lookback,
            rebalance_every=rebalance_every,
            cost_bps=request.cost_bps,
            turnover_budget=request.turnover_budget if with_turnover else None,
            no_trade_band=request.no_trade_band if with_turnover else 0.0,
        )

    paths: list[tuple[str, str, BacktestPath]] = []

    strategy_fn = make_optimizer_strategy(
        strategy_tickers,
        request.objective,
        request.risk_model,
        request.ewma_lambda,
        request.min_weight,
        request.max_weight,
        risk_free_rate,
        settings.trading_days,
    )
    try:
        paths.append(("Optimized portfolio", "strategy", _run(strategy_fn, with_turnover=True)))
    except BacktestError as error:
        raise BacktestServiceError(str(error), 422) from error

    benchmark_builders = {
        "index": (_INDEX_NAME, static_strategy({INDEX_TICKER: 1.0}), [INDEX_TICKER]),
        "equal_weight": ("Equal weight", equal_weight_strategy(strategy_tickers), strategy_tickers),
        "sixty_forty": ("60/40", static_strategy({INDEX_TICKER: 0.6, BOND_TICKER: 0.4}), [INDEX_TICKER, BOND_TICKER]),
    }
    for name in request.benchmarks:
        builder = benchmark_builders.get(name)
        if builder is None:
            continue
        label, weight_fn, required = builder
        if not all(ticker in frame.columns for ticker in required):
            continue
        try:
            paths.append((label, "benchmark", _run(weight_fn, with_turnover=False)))
        except BacktestError:
            continue

    index_returns = next(
        (_returns_series(path) for label, _, path in paths if label == _INDEX_NAME),
        None,
    )

    strategies = [
        _build_result(label, kind, path, index_returns if label != _INDEX_NAME else None, settings, risk_free_rate)
        for label, kind, path in paths
    ]

    return BacktestResponse(
        provider=provider.name,
        as_of_start=frame.index.min().date(),
        as_of_end=frame.index.max().date(),
        rebalance=request.rebalance,
        cost_bps=request.cost_bps,
        risk_free_rate=risk_free_rate,
        strategies=strategies,
    )


def _returns_series(path: BacktestPath) -> pd.Series:
    return pd.Series(path.returns, index=pd.to_datetime(path.dates))


def _build_result(
    label: str,
    kind: str,
    path: BacktestPath,
    benchmark_returns: pd.Series | None,
    settings: Settings,
    risk_free_rate: float,
) -> StrategyResult:
    returns = _returns_series(path)
    stats = performance_stats(returns, settings.trading_days, risk_free_rate)
    avg_turnover = float(sum(path.turnover) / len(path.turnover)) if path.turnover else 0.0

    relative = None
    if benchmark_returns is not None:
        rel = relative_stats(returns, benchmark_returns, settings.trading_days, risk_free_rate)
        relative = RelativeStatsSchema(
            alpha=rel.alpha,
            beta=rel.beta,
            tracking_error=rel.tracking_error,
            information_ratio=rel.information_ratio,
        )

    rolling = rolling_sharpe(returns, _ROLLING_WINDOW, settings.trading_days, risk_free_rate)

    return StrategyResult(
        name=label,
        kind=kind,
        stats=StrategyStats(
            total_return=stats.total_return,
            cagr=stats.cagr,
            annual_volatility=stats.annual_volatility,
            sharpe_ratio=stats.sharpe_ratio,
            sortino_ratio=stats.sortino_ratio,
            max_drawdown=stats.max_drawdown,
            calmar_ratio=stats.calmar_ratio,
            avg_turnover=avg_turnover,
            transaction_cost=path.total_cost,
        ),
        relative=relative,
        curve=[
            CurvePoint(date=point_date, equity=round(equity, 6), drawdown=round(drawdown, 6))
            for point_date, equity, drawdown in zip(path.dates, path.equity, path.drawdown, strict=True)
        ],
        rolling_sharpe=[
            RollingPoint(date=stamp.date(), sharpe=round(float(value), 4))
            for stamp, value in rolling.items()
        ],
    )
