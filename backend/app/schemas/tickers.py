from pydantic import BaseModel, Field


class TickerValidationRequest(BaseModel):
    tickers: list[str] = Field(min_length=1, max_length=50)


class TickerValidation(BaseModel):
    ticker: str
    valid: bool


class TickerValidationResponse(BaseModel):
    results: list[TickerValidation]
    valid: list[str]
    invalid: list[str]
