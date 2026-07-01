from datetime import date

from pydantic import BaseModel


class RiskContribution(BaseModel):
    ticker: str
    weight: float
    risk_contribution: float
    return_contribution: float
    at_max_bound: bool
    at_min_bound: bool


class Counterfactual(BaseModel):
    label: str
    description: str
    expected_return: float
    volatility: float
    sharpe_ratio: float
    delta_sharpe: float


class ExplainResponse(BaseModel):
    objective: str
    as_of_start: date
    as_of_end: date
    expected_return: float
    volatility: float
    sharpe_ratio: float
    effective_holdings: float
    concentration_hhi: float
    binding_max_weight: bool
    binding_tickers: list[str]
    top_risk_driver: str | None
    contributions: list[RiskContribution]
    counterfactuals: list[Counterfactual]
