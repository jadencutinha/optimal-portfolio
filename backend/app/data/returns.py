import pandas as pd


def build_price_frame(series_by_ticker: dict[str, pd.Series], min_observations: int) -> pd.DataFrame:
    if not series_by_ticker:
        return pd.DataFrame()
    frame = pd.DataFrame(series_by_ticker).sort_index()
    frame = frame.dropna(axis=1, thresh=min_observations)
    frame = frame.dropna(axis=0, how="any")
    return frame


def daily_returns(prices: pd.DataFrame) -> pd.DataFrame:
    return prices.pct_change().dropna(how="any")


def annualized_mean(returns: pd.DataFrame, trading_days: int) -> pd.Series:
    return returns.mean() * trading_days


def annualized_covariance(returns: pd.DataFrame, trading_days: int) -> pd.DataFrame:
    covariance = returns.cov() * trading_days
    values = covariance.to_numpy()
    symmetric = (values + values.T) / 2.0
    return pd.DataFrame(symmetric, index=covariance.index, columns=covariance.columns)
