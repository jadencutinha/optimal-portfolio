from __future__ import annotations

from datetime import date, timedelta

import numpy as np
import pandas as pd

from app.data.provider import DataProvider, ProviderError
from app.data.sample import SampleProvider
from app.schemas.game import (
    GameAward,
    GameMeta,
    GamePathPoint,
    GamePlayerResult,
    GameRequest,
    GameResponse,
)

START_VALUE = 10_000.0
HISTORY_DAYS = 365 * 6
HISTORY_YEARS = 6
TRADING_DAYS = 252
SIMULATIONS = 500
# Clamp the annualised drift so a single historical rocket ship cannot produce an
# absurd result, while still rewarding stronger historical performers.
DRIFT_MIN = -0.10
DRIFT_MAX = 0.32
FALLBACK_DRIFT = 0.07
FALLBACK_VOL = 0.18


def _daily_returns(prices: dict[str, pd.Series]) -> dict[str, pd.Series]:
    returns: dict[str, pd.Series] = {}
    for ticker, series in prices.items():
        clean = series.dropna().sort_index()
        change = clean.pct_change().dropna()
        if len(change) > 30:
            returns[ticker] = change
    return returns


def _player_params(
    tickers: list[str], returns: dict[str, pd.Series]
) -> tuple[float, float, list[str], str | None, float]:
    upper = [ticker.strip().upper() for ticker in tickers if ticker.strip()]
    valid = [ticker for ticker in upper if ticker in returns]

    if valid:
        frame = pd.DataFrame({ticker: returns[ticker] for ticker in valid}).dropna()
        portfolio = frame.mean(axis=1) if not frame.empty else pd.Series(dtype=float)
        best = max(valid, key=lambda ticker: float(returns[ticker].mean()))
        best_return = float(returns[best].mean() * TRADING_DAYS)
    else:
        portfolio = pd.Series(dtype=float)
        best = None
        best_return = 0.0

    if len(portfolio) > 30:
        mu_annual = float(np.clip(portfolio.mean() * TRADING_DAYS, DRIFT_MIN, DRIFT_MAX))
        vol_annual = max(float(portfolio.std() * np.sqrt(TRADING_DAYS)), 0.06)
    else:
        mu_annual = FALLBACK_DRIFT
        vol_annual = FALLBACK_VOL

    return mu_annual, vol_annual, valid, best, best_return


def _simulate_monthly(mu_annual: float, vol_annual: float, months: int, rng: np.random.Generator) -> np.ndarray:
    """Return an (SIMULATIONS, months + 1) array of monthly portfolio values."""
    drift = mu_annual / 12.0 - 0.5 * (vol_annual**2) / 12.0
    shock = vol_annual / np.sqrt(12.0)
    steps = rng.normal(drift, shock, size=(SIMULATIONS, months))
    cumulative = np.cumsum(steps, axis=1)
    equity = START_VALUE * np.exp(cumulative)
    start_column = np.full((SIMULATIONS, 1), START_VALUE)
    return np.concatenate([start_column, equity], axis=1)


def _awards(results: list[GamePlayerResult], best_returns: list[float]) -> list[GameAward]:
    awards: list[GameAward] = []

    champion = int(np.argmax([r.median_final for r in results]))
    awards.append(
        GameAward(
            category="champion",
            label="Champion",
            player_index=champion,
            detail=f"Highest typical outcome, a median of ${results[champion].median_final:,.0f}",
        )
    )

    odds = int(np.argmax([r.win_probability for r in results]))
    awards.append(
        GameAward(
            category="best_odds",
            label="Best odds",
            player_index=odds,
            detail=f"Won {results[odds].win_probability * 100:.0f}% of the simulated runs",
        )
    )

    ceiling = int(np.argmax([r.p90_final for r in results]))
    awards.append(
        GameAward(
            category="highest_ceiling",
            label="Highest ceiling",
            player_index=ceiling,
            detail=f"Best-case run reached about ${results[ceiling].p90_final:,.0f}",
        )
    )

    steadiest = int(np.argmin([r.volatility for r in results]))
    awards.append(
        GameAward(
            category="steadiest",
            label="Steadiest",
            player_index=steadiest,
            detail=f"Lowest volatility at {results[steadiest].volatility * 100:.0f}% a year",
        )
    )

    resilient = int(np.argmax([r.resilience for r in results]))
    awards.append(
        GameAward(
            category="most_resilient",
            label="Best longevity",
            player_index=resilient,
            detail=f"Grew above the starting stake in {results[resilient].resilience * 100:.0f}% of runs",
        )
    )

    if any(value > 0 for value in best_returns):
        best_pick = int(np.argmax(best_returns))
        ticker = results[best_pick].best_ticker
        if ticker:
            awards.append(
                GameAward(
                    category="best_pick",
                    label="Best single pick",
                    player_index=best_pick,
                    detail=f"{ticker} returned about {best_returns[best_pick] * 100:.0f}% a year historically",
                )
            )

    return awards


def _meta(data_source: str, years: int) -> GameMeta:
    if data_source == "real":
        source = (
            f"Daily closing prices for every stock over the last {HISTORY_YEARS} years, "
            "pulled from Financial Modeling Prep, the same market-data feed the rest of the app uses."
        )
        credibility = (
            "Each portfolio's real drift and volatility are measured from those actual closing prices, "
            "so the ranges reflect how these stocks have genuinely behaved rather than a guess."
        )
    else:
        source = (
            "The live market-data feed was unavailable or rate limited, so this run used the app's "
            "deterministic synthetic price model as a stand-in."
        )
        credibility = (
            "Numbers are illustrative for this run. Try again once the live feed has quota to base the "
            "simulation on real closing prices."
        )
    return GameMeta(
        simulations=SIMULATIONS,
        data_source=data_source,
        history_years=HISTORY_YEARS,
        source=source,
        method=(
            f"Monte Carlo simulation. We run {SIMULATIONS} independent {years}-year paths per player using "
            "geometric Brownian motion seeded with each portfolio's historical drift and volatility, then "
            "rank by the median outcome."
        ),
        credibility=credibility,
    )


async def simulate_game(request: GameRequest, provider: DataProvider) -> GameResponse:
    years = request.years
    months = years * 12
    rng = np.random.default_rng(request.seed)

    all_tickers = sorted(
        {ticker.strip().upper() for player in request.players for ticker in player.tickers if ticker.strip()}
    )
    end = date.today()
    start = end - timedelta(days=HISTORY_DAYS)
    prices: dict = {}
    data_source = "real"
    if all_tickers:
        try:
            prices = await provider.get_prices(all_tickers, start, end)
        except ProviderError:
            prices = await SampleProvider(TRADING_DAYS).get_prices(all_tickers, start, end)
            data_source = "synthetic"
    else:
        data_source = "synthetic"
    returns = _daily_returns(prices)

    finals: list[np.ndarray] = []
    results: list[GamePlayerResult] = []
    best_returns: list[float] = []
    for player in request.players:
        mu_annual, vol_annual, valid, best, best_return = _player_params(player.tickers, returns)
        paths = _simulate_monthly(mu_annual, vol_annual, months, rng)
        final_values = paths[:, -1]
        median_path = np.median(paths, axis=0)
        median_final = float(np.median(final_values))

        finals.append(final_values)
        best_returns.append(best_return)
        results.append(
            GamePlayerResult(
                name=player.name,
                tickers=[ticker.strip().upper() for ticker in player.tickers if ticker.strip()],
                resolved_tickers=valid,
                start_value=START_VALUE,
                final_value=round(median_final, 2),
                return_pct=round(median_final / START_VALUE - 1.0, 4),
                cagr=round((median_final / START_VALUE) ** (1.0 / years) - 1.0, 4),
                best_ticker=best,
                median_final=round(median_final, 2),
                p10_final=round(float(np.percentile(final_values, 10)), 2),
                p90_final=round(float(np.percentile(final_values, 90)), 2),
                volatility=round(vol_annual, 4),
                resilience=round(float(np.mean(final_values > START_VALUE)), 4),
                path=[GamePathPoint(month=m, value=round(float(median_path[m]), 2)) for m in range(months + 1)],
            )
        )

    stacked = np.vstack(finals)
    win_counts = np.bincount(np.argmax(stacked, axis=0), minlength=len(results))
    for index, result in enumerate(results):
        result.win_probability = round(float(win_counts[index] / SIMULATIONS), 4)

    winner_index = int(np.argmax([result.median_final for result in results]))
    return GameResponse(
        years=years,
        months=months,
        start_value=START_VALUE,
        winner_index=winner_index,
        players=results,
        awards=_awards(results, best_returns),
        meta=_meta(data_source, years),
    )
