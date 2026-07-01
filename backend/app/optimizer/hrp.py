import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage
from scipy.spatial.distance import squareform

from app.optimizer.markowitz import OptimizationError


def _inverse_variance(cov: np.ndarray) -> np.ndarray:
    ivp = 1.0 / np.clip(np.diag(cov), 1e-16, None)
    return ivp / ivp.sum()


def _cluster_variance(cov: np.ndarray, items: list[int]) -> float:
    sub = cov[np.ix_(items, items)]
    weights = _inverse_variance(sub)
    return float(weights @ sub @ weights)


def _quasi_diagonal(link: np.ndarray) -> list[int]:
    link = link.astype(int)
    sort_ix = pd.Series([link[-1, 0], link[-1, 1]])
    num_items = link[-1, 3]
    while sort_ix.max() >= num_items:
        sort_ix.index = range(0, sort_ix.shape[0] * 2, 2)
        clustered = sort_ix[sort_ix >= num_items]
        positions = clustered.index
        merges = clustered.values - num_items
        sort_ix[positions] = link[merges, 0]
        right = pd.Series(link[merges, 1], index=positions + 1)
        sort_ix = pd.concat([sort_ix, right]).sort_index()
        sort_ix.index = range(sort_ix.shape[0])
    return sort_ix.tolist()


def _recursive_bisection(cov: np.ndarray, sort_ix: list[int]) -> pd.Series:
    weights = pd.Series(1.0, index=sort_ix)
    clusters = [sort_ix]
    while clusters:
        clusters = [
            cluster[start:stop]
            for cluster in clusters
            for start, stop in ((0, len(cluster) // 2), (len(cluster) // 2, len(cluster)))
            if len(cluster) > 1
        ]
        for i in range(0, len(clusters), 2):
            left = clusters[i]
            right = clusters[i + 1]
            var_left = _cluster_variance(cov, left)
            var_right = _cluster_variance(cov, right)
            alpha = 1.0 - var_left / (var_left + var_right)
            weights.loc[left] *= alpha
            weights.loc[right] *= 1.0 - alpha
    return weights


def hierarchical_risk_parity(covariance: np.ndarray) -> tuple[np.ndarray, str]:
    n = covariance.shape[0]
    if n == 1:
        return np.array([1.0]), "optimal"
    std = np.sqrt(np.clip(np.diag(covariance), 1e-16, None))
    corr = np.clip(covariance / np.outer(std, std), -1.0, 1.0)
    distance = np.sqrt(np.clip(0.5 * (1.0 - corr), 0.0, None))
    condensed = squareform(distance, checks=False)
    link = linkage(condensed, method="single")
    sort_ix = _quasi_diagonal(link)
    weights = _recursive_bisection(covariance, sort_ix)
    ordered = weights.reindex(range(n)).fillna(0.0).to_numpy()
    total = ordered.sum()
    if not np.isfinite(total) or total <= 0:
        raise OptimizationError("Hierarchical risk parity produced a degenerate allocation.")
    return ordered / total, "optimal"
