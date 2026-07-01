from fastapi import APIRouter, Depends, HTTPException, Response

from app.api.deps import get_access, get_provider, get_sector_provider, get_settings
from app.auth.gating import Access, check_optimize
from app.config import Settings
from app.data.provider import DataProvider
from app.data.sectors import SectorProvider
from app.optimizer.service import OptimizationServiceError, run_optimization
from app.reports.pdf import build_report
from app.schemas.optimize import OptimizeRequest

router = APIRouter(tags=["reports"])


@router.post("/report/pdf")
async def report_pdf(
    request: OptimizeRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    sector_provider: SectorProvider = Depends(get_sector_provider),
    access: Access = Depends(get_access),
) -> Response:
    check_optimize(
        tickers=request.tickers,
        objective=request.objective,
        risk_model=request.risk_model,
        return_model=request.return_model,
        lookback_days=request.lookback_days,
        entitlements=access.entitlements,
    )
    sectors = await sector_provider.resolve(request.tickers)
    try:
        response, _ = await run_optimization(request, provider, settings, sectors)
    except OptimizationServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    pdf_bytes = build_report(response)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="portfolio-report.pdf"'},
    )
