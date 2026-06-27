from typing import Literal

Plan = Literal["free", "pro", "course"]

PLANS: tuple[Plan, ...] = ("free", "pro", "course")

_ENTITLEMENTS: dict[str, dict] = {
    "free": {
        "max_tickers": 8,
        "risk_models": ["sample"],
        "objectives": ["min_variance", "max_sharpe"],
        "max_lookback_days": 756,
        "daily_optimizations": 10,
        "advanced_optimizers": False,
        "live_demo": False,
        "saved_portfolios": 3,
        "course_access": False,
    },
    "pro": {
        "max_tickers": 50,
        "risk_models": ["sample", "ledoit_wolf", "ewma"],
        "objectives": ["min_variance", "max_sharpe", "target_return", "target_risk"],
        "max_lookback_days": 3650,
        "daily_optimizations": None,
        "advanced_optimizers": True,
        "live_demo": True,
        "saved_portfolios": None,
        "course_access": True,
    },
    "course": {
        "max_tickers": 8,
        "risk_models": ["sample"],
        "objectives": ["min_variance", "max_sharpe"],
        "max_lookback_days": 756,
        "daily_optimizations": 10,
        "advanced_optimizers": False,
        "live_demo": False,
        "saved_portfolios": 3,
        "course_access": True,
    },
}


def entitlements_for(plan: str) -> dict:
    return _ENTITLEMENTS.get(plan, _ENTITLEMENTS["free"])
