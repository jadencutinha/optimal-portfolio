from dataclasses import dataclass
from datetime import date

from fastapi import HTTPException

from app.data.cache import Cache

BASIC_OBJECTIVES = {"min_variance", "max_sharpe"}


@dataclass
class Access:
    plan: str
    user_id: str | None
    entitlements: dict


def _deny(message: str) -> None:
    raise HTTPException(status_code=403, detail=f"{message} Upgrade to Pro to unlock.")


def check_optimize(
    *,
    tickers: list[str],
    objective: str,
    risk_model: str,
    return_model: str,
    lookback_days: int | None,
    entitlements: dict,
) -> None:
    if len(tickers) > entitlements["max_tickers"]:
        _deny(f"Your plan allows up to {entitlements['max_tickers']} tickers.")
    if risk_model not in entitlements["risk_models"]:
        _deny("That risk model is a Pro feature.")
    if objective not in BASIC_OBJECTIVES and not entitlements["advanced_optimizers"]:
        _deny("That objective is a Pro feature.")
    if return_model and return_model != "historical" and not entitlements["advanced_optimizers"]:
        _deny("Black-Litterman return estimates are a Pro feature.")
    if lookback_days and lookback_days > entitlements["max_lookback_days"]:
        _deny(f"Your plan allows up to {entitlements['max_lookback_days']} lookback days.")


def require_pro(entitlements: dict, feature: str = "This feature") -> None:
    if not entitlements.get("advanced_optimizers"):
        _deny(f"{feature} is a Pro feature.")


async def enforce_quota(access: Access, cache: Cache) -> None:
    limit = access.entitlements.get("daily_optimizations")
    if limit is None or access.user_id is None:
        return
    key = f"quota:{access.user_id}:{date.today().isoformat()}"
    raw = await cache.get(key)
    used = int(raw) if raw else 0
    if used >= limit:
        raise HTTPException(
            status_code=403,
            detail="You have reached today's optimization limit. Upgrade to Pro for unlimited runs.",
        )
    await cache.set(key, str(used + 1), 86400)
