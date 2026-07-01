from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_provider, get_settings
from app.config import Settings
from app.data.provider import DataProvider
from app.data.returns import build_price_frame
from app.schemas.tracking import TrackHoldingSchema, TrackPoint, TrackRequest, TrackResponse
from app.tracking.drift import track

router = APIRouter(tags=["tracking"])


@router.post("/track", response_model=TrackResponse)
async def track_portfolio(
    request: TrackRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
) -> TrackResponse:
    target = {ticker.strip().upper(): weight for ticker, weight in request.weights.items() if weight > 0}
    if not target:
        raise HTTPException(status_code=422, detail="Provide at least one holding with a positive weight.")

    end = date.today()
    start = end - timedelta(days=request.lookback_days)
    prices = await provider.get_prices(list(target.keys()), start, end)
    frame = build_price_frame(prices, min_observations=2)
    if frame.empty or frame.shape[0] < 2:
        raise HTTPException(status_code=422, detail="Not enough recent price history to track this portfolio.")

    result = track(frame, target, request.band)

    return TrackResponse(
        as_of=result.as_of,
        total_return=result.total_return,
        max_drift=result.max_drift,
        turnover_to_rebalance=result.turnover_to_rebalance,
        rebalance_needed=result.rebalance_needed,
        band=result.band,
        top_drifter=result.top_drifter,
        holdings=[
            TrackHoldingSchema(ticker=h.ticker, target=h.target, current=h.current, drift=h.drift)
            for h in result.holdings
        ],
        timeline=[TrackPoint(date=point["date"], drift=point["drift"]) for point in result.timeline],
        missing_tickers=result.missing_tickers,
    )
