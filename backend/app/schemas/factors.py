from pydantic import BaseModel

from app.schemas.optimize import WeightAllocation


class FactorExposureSchema(BaseModel):
    key: str
    label: str
    beta: float
    t_stat: float
    factor_return: float
    contribution: float


class FactorResponse(BaseModel):
    objective: str
    weights: list[WeightAllocation]
    exposures: list[FactorExposureSchema]
    alpha: float
    r_squared: float
    idiosyncratic_vol: float
    observations: int
    note: str
