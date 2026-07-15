from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.api.deps import get_access, get_provider, get_sector_provider, get_settings
from app.auth.gating import Access, check_optimize
from app.config import Settings
from app.data.provider import DataProvider
from app.data.sectors import SectorProvider
from app.optimizer.service import OptimizationServiceError, run_optimization
from app.ratelimit import HEAVY, limiter
from app.reports.pdf import build_report
from app.schemas.optimize import OptimizeRequest

router = APIRouter(tags=["reports"])


@router.post("/report/pdf")
@limiter.limit(HEAVY)
async def report_pdf(
    request: Request,
    payload: OptimizeRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> Response:
    check_optimize(
        tickers=payload.tickers,
        objective=payload.objective,
        risk_model=payload.risk_model,
        return_model=payload.return_model,
        lookback_days=payload.lookback_days,
        entitlements=access.entitlements,
    )
    sectors = await sector_provider.resolve(payload.tickers)
    try:
        response, _ = await run_optimization(payload, provider, settings, sectors)
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    pdf_bytes = build_report(response)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="portfolio-report.pdf"'},
    )
