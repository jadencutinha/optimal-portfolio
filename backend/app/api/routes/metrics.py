from fastapi import APIRouter, Depends

from app.api.deps import get_metrics
from app.observability.metrics import MetricsCollector

router = APIRouter(tags=["observability"])


@router.get("/metrics")
async def metrics(collector: MetricsCollector = Depends(get_metrics)) -> dict:
    return collector.snapshot()
