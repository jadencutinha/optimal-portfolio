from typing import Literal

Plan = Literal["free", "pro"]

PLANS: tuple[Plan, ...] = ("free", "pro")

LEGACY_PLANS: dict[str, Plan] = {"course": "free"}

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
        "course_access": True,
        "trade_fee_bps": 25,
    },
    "pro": {
        "max_tickers": 50,
        "risk_models": ["sample", "ledoit_wolf", "ewma", "factor"],
        "objectives": ["min_variance", "max_sharpe", "target_return", "target_risk"],
        "max_lookback_days": 3650,
        "daily_optimizations": None,
        "advanced_optimizers": True,
        "live_demo": True,
        "saved_portfolios": None,
        "course_access": True,
        "trade_fee_bps": 0,
    },
}


def normalize_plan(value: str) -> Plan:
    if value in PLANS:
        return value  # type: ignore[return-value]
    return LEGACY_PLANS.get(value, "free")


def entitlements_for(plan: str) -> dict:
    return _ENTITLEMENTS[normalize_plan(plan)]
