import numpy as np
import pytest

from app.optimizer import markowitz
from app.optimizer.constraints import ConstraintError, build_bounds
from app.schemas.optimize import AssetBound, SectorCap

TICKERS = ["AAPL", "MSFT", "JPM", "XOM"]
SECTORS = {"AAPL": "Tech", "MSFT": "Tech", "JPM": "Financials", "XOM": "Energy"}


def make_problem() -> tuple[np.ndarray, np.ndarray]:
    mu = np.array([0.10, 0.12, 0.09, 0.15])
    volatilities = np.array([0.15, 0.20, 0.12, 0.30])
    correlation = np.array(
        [
            [1.0, 0.30, 0.20, 0.10],
            [0.30, 1.0, 0.25, 0.15],
            [0.20, 0.25, 1.0, 0.05],
            [0.10, 0.15, 0.05, 1.0],
        ]
    )
    covariance = np.outer(volatilities, volatilities) * correlation
    return mu, covariance


def test_sector_cap_enforced_in_optimizer() -> None:
    mu, covariance = make_problem()
    bounds = build_bounds(
        TICKERS, 0.0, 1.0, sector_caps=[SectorCap(sector="Tech", max_weight=0.4)], sectors=SECTORS
    )
    weights, _ = markowitz.max_sharpe(mu, covariance, risk_free_rate=0.02, bounds=bounds)
    assert weights[0] + weights[1] <= 0.4 + 1e-4


def test_per_asset_and_sector_constraints_compose() -> None:
    mu, covariance = make_problem()
    bounds = build_bounds(
        TICKERS,
        0.0,
        0.5,
        asset_bounds=[AssetBound(ticker="XOM", max_weight=0.1)],
        sector_caps=[SectorCap(sector="Tech", max_weight=0.5)],
        sectors=SECTORS,
    )
    weights, _ = markowitz.min_variance(mu, covariance, bounds=bounds)
    assert weights[3] <= 0.1 + 1e-4
    assert weights[0] + weights[1] <= 0.5 + 1e-4


def test_unreachable_full_investment_raises() -> None:
    with pytest.raises(ConstraintError):
        build_bounds(TICKERS, 0.0, 0.2)


def test_sector_cap_below_floor_raises() -> None:
    with pytest.raises(ConstraintError):
        build_bounds(
            TICKERS,
            0.0,
            1.0,
            asset_bounds=[AssetBound(ticker="AAPL", min_weight=0.3), AssetBound(ticker="MSFT", min_weight=0.3)],
            sector_caps=[SectorCap(sector="Tech", max_weight=0.4)],
            sectors=SECTORS,
        )
