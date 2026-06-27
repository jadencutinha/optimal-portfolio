from pydantic import BaseModel

from app.auth.plans import Plan


class MeResponse(BaseModel):
    id: str
    email: str | None
    plan: str
    plan_selected: bool
    entitlements: dict


class PlanUpdate(BaseModel):
    plan: Plan
