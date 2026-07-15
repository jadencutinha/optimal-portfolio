from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
MARKET_OPEN = time(9, 30)
MARKET_CLOSE = time(16, 0)


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _to_et(moment: datetime) -> datetime:
    return moment.replace(tzinfo=timezone.utc).astimezone(ET)


def is_market_open(moment: datetime | None = None) -> bool:
    et = _to_et(moment or utcnow())
    if et.weekday() >= 5:
        return False
    return MARKET_OPEN <= et.time() < MARKET_CLOSE


def next_market_open(moment: datetime | None = None) -> datetime:
    et = _to_et(moment or utcnow())
    day = et.date()
    if et.time() >= MARKET_OPEN:
        day = day + timedelta(days=1)
    while day.weekday() >= 5:
        day = day + timedelta(days=1)
    open_et = datetime.combine(day, MARKET_OPEN, tzinfo=ET)
    return open_et.astimezone(timezone.utc).replace(tzinfo=None)
