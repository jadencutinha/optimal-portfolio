import numpy as np


def equilibrium_returns(covariance: np.ndarray, market_weights: np.ndarray, risk_aversion: float) -> np.ndarray:
    return risk_aversion * (covariance @ market_weights)


def black_litterman(
    covariance: np.ndarray,
    market_weights: np.ndarray,
    risk_aversion: float = 2.5,
    tau: float = 0.05,
    views: np.ndarray | None = None,
    view_returns: np.ndarray | None = None,
    view_confidence: np.ndarray | None = None,
) -> np.ndarray:
    prior = equilibrium_returns(covariance, market_weights, risk_aversion)
    if views is None or view_returns is None or len(views) == 0:
        return prior

    scaled = tau * covariance
    if view_confidence is None:
        view_confidence = np.diag(np.diag(views @ scaled @ views.T))

    middle = np.linalg.inv(views @ scaled @ views.T + view_confidence)
    adjustment = scaled @ views.T @ middle @ (view_returns - views @ prior)
    return prior + adjustment
