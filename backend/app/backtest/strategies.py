import pandas as pd

from app.backtest.engine import WeightFn
from app.optimizer import markowitz
from app.optimizer.constraints import uniform_bounds
from app.optimizer.risk_models import RiskModel, estimate_covariance

INDEX_TICKER = "SPY"
BOND_TICKER = "BND"


def make_optimizer_strategy(
    tickers: list[str],
    objective: str,
    risk_model: RiskModel,
    ewma_lambda: float,
    w_min: float,
    w_max: float,
    risk_free_rate: float,
    trading_days: int,
    min_observations: int = 20,
) -> WeightFn:
    universe = list(tickers)

    def weight_fn(window: pd.DataFrame) -> pd.Series | None:
        columns = [ticker for ticker in universe if ticker in window.columns]
        if len(columns) < 2:
            return None
        sub = window[columns].dropna(axis=1, how="any")
        if sub.shape[1] < 2:
            return None
        returns = sub.pct_change().dropna(how="any")
        if len(returns) < min_observations:
            return None
        mu = (returns.mean() * trading_days).to_numpy()
        covariance, _ = estimate_covariance(returns, trading_days, risk_model, ewma_lambda)
        bounds = uniform_bounds(sub.shape[1], w_min, w_max)
        try:
            if objective == "min_variance":
                weights, _ = markowitz.min_variance(mu, covariance, bounds=bounds)
            else:
                weights, _ = markowitz.max_sharpe(mu, covariance, risk_free_rate=risk_free_rate, bounds=bounds)
        except markowitz.OptimizationError:
            return None
        return pd.Series(weights, index=sub.columns)

    return weight_fn


def equal_weight_strategy(tickers: list[str]) -> WeightFn:
    universe = list(tickers)

    def weight_fn(window: pd.DataFrame) -> pd.Series | None:
        present = [ticker for ticker in universe if ticker in window.columns and window[ticker].notna().any()]
        if not present:
            return None
        return pd.Series(1.0 / len(present), index=present)

    return weight_fn


def static_strategy(target_weights: dict[str, float]) -> WeightFn:
    def weight_fn(window: pd.DataFrame) -> pd.Series | None:
        present = {
            ticker: weight
            for ticker, weight in target_weights.items()
            if ticker in window.columns and window[ticker].notna().any()
        }
        if not present:
            return None
        total = sum(present.values())
        return pd.Series({ticker: weight / total for ticker, weight in present.items()})

    return weight_fn
