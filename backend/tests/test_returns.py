import numpy as np
import pandas as pd

from app.data.returns import annualized_covariance, annualized_mean, build_price_frame, daily_returns


def make_prices() -> pd.DataFrame:
    index = pd.bdate_range("2024-01-01", periods=12)
    return pd.DataFrame(
        {
            "A": np.linspace(100.0, 111.0, 12),
            "B": np.linspace(50.0, 56.0, 12),
        },
        index=index,
    )


def test_daily_returns_drop_first_row() -> None:
    returns = daily_returns(make_prices())
    assert len(returns) == 11
    assert list(returns.columns) == ["A", "B"]


def test_annualized_statistics_shapes() -> None:
    returns = daily_returns(make_prices())
    mu = annualized_mean(returns, 252)
    covariance = annualized_covariance(returns, 252)
    assert list(mu.index) == ["A", "B"]
    assert covariance.shape == (2, 2)
    assert np.allclose(covariance.to_numpy(), covariance.to_numpy().T)


def test_build_price_frame_aligns_and_drops_sparse_columns() -> None:
    index = pd.bdate_range("2024-01-01", periods=5)
    dense = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0], index=index)
    sparse = pd.Series([1.0, 2.0], index=index[:2])
    frame = build_price_frame({"DENSE": dense, "SPARSE": sparse}, min_observations=4)
    assert list(frame.columns) == ["DENSE"]
    assert len(frame) == 5
