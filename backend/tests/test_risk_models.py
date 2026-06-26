import numpy as np
import pandas as pd

from app.optimizer.risk_models import estimate_covariance


def make_returns(seed: int = 0, t: int = 300, n: int = 5) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    market = rng.normal(0.0, 0.01, t)
    columns = {}
    for i in range(n):
        beta = rng.uniform(0.5, 1.5)
        columns[f"A{i}"] = beta * market + rng.normal(0.0, 0.01, t)
    return pd.DataFrame(columns)


def _is_psd(matrix: np.ndarray) -> bool:
    return bool(np.all(np.linalg.eigvalsh(matrix) >= -1e-8))


def test_all_estimators_are_symmetric_and_psd() -> None:
    returns = make_returns()
    for model in ("sample", "ledoit_wolf", "ewma"):
        covariance, _ = estimate_covariance(returns, 252, model)
        assert covariance.shape == (5, 5)
        assert np.allclose(covariance, covariance.T)
        assert _is_psd(covariance)


def test_ledoit_wolf_shrinkage_is_a_unit_interval_weight() -> None:
    returns = make_returns()
    _, shrinkage = estimate_covariance(returns, 252, "ledoit_wolf")
    assert shrinkage is not None
    assert 0.0 <= shrinkage <= 1.0


def test_ledoit_wolf_preserves_variances_and_shrinks_noise() -> None:
    returns = make_returns()
    sample, _ = estimate_covariance(returns, 252, "sample")
    shrunk, shrinkage = estimate_covariance(returns, 252, "ledoit_wolf")
    assert shrinkage > 0.0
    assert np.allclose(np.diag(sample), np.diag(shrunk), rtol=1e-6)


def test_ewma_emphasises_recent_observations() -> None:
    rng = np.random.default_rng(1)
    calm = rng.normal(0.0, 0.005, 200)
    stormy = rng.normal(0.0, 0.03, 100)
    series = np.concatenate([calm, stormy])
    returns = pd.DataFrame({"A": series, "B": 0.5 * series + rng.normal(0.0, 0.001, 300)})
    ewma, _ = estimate_covariance(returns, 252, "ewma")
    sample, _ = estimate_covariance(returns, 252, "sample")
    assert ewma[0, 0] > sample[0, 0]
