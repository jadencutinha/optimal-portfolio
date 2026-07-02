import re

from fastapi import APIRouter, Depends, HTTPException, Response

from app.api.deps import get_current_user, get_portfolio_repository
from app.auth.plans import entitlements_for
from app.auth.repository import ProfileData
from app.db.models import SavedPortfolio
from app.portfolios.repository import PortfolioRepository
from app.reports.pdf import build_saved_report
from app.schemas.portfolio import PortfolioCreate, PortfolioDetail, PortfolioSummary

router = APIRouter(tags=["portfolios"])


def _summary(portfolio: SavedPortfolio) -> PortfolioSummary:
    return PortfolioSummary(
        id=portfolio.id,
        name=portfolio.name,
        objective=portfolio.objective,
        risk_model=portfolio.risk_model,
        metrics=portfolio.metrics,
        created_at=portfolio.created_at,
    )


@router.post("/portfolios", response_model=PortfolioSummary)
async def create_portfolio(
    body: PortfolioCreate,
    user: ProfileData = Depends(get_current_user),
    repository: PortfolioRepository = Depends(get_portfolio_repository),
) -> PortfolioSummary:
    limit = entitlements_for(user.plan).get("saved_portfolios")
    if limit is not None and await repository.count(user.id) >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"Your plan allows up to {limit} saved portfolios. Upgrade to Pro for unlimited saves.",
        )
    portfolio_id = await repository.save(
        user_id=user.id,
        name=body.name,
        objective=body.objective,
        risk_model=body.risk_model,
        tickers=body.tickers,
        weights=body.weights,
        metrics=body.metrics,
    )
    saved = await repository.get(user.id, portfolio_id)
    return _summary(saved)


@router.get("/portfolios", response_model=list[PortfolioSummary])
async def list_portfolios(
    user: ProfileData = Depends(get_current_user),
    repository: PortfolioRepository = Depends(get_portfolio_repository),
) -> list[PortfolioSummary]:
    return [_summary(portfolio) for portfolio in await repository.list_for_user(user.id)]


@router.get("/portfolios/{portfolio_id}", response_model=PortfolioDetail)
async def get_portfolio(
    portfolio_id: int,
    user: ProfileData = Depends(get_current_user),
    repository: PortfolioRepository = Depends(get_portfolio_repository),
) -> PortfolioDetail:
    portfolio = await repository.get(user.id, portfolio_id)
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    return PortfolioDetail(
        id=portfolio.id,
        name=portfolio.name,
        objective=portfolio.objective,
        risk_model=portfolio.risk_model,
        metrics=portfolio.metrics,
        created_at=portfolio.created_at,
        tickers=portfolio.tickers,
        weights=portfolio.weights,
    )


@router.get("/portfolios/{portfolio_id}/report.pdf")
async def portfolio_report(
    portfolio_id: int,
    user: ProfileData = Depends(get_current_user),
    repository: PortfolioRepository = Depends(get_portfolio_repository),
) -> Response:
    portfolio = await repository.get(user.id, portfolio_id)
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    created = portfolio.created_at
    created_str = created.date().isoformat() if hasattr(created, "date") else str(created)[:10]
    pdf_bytes = build_saved_report(
        name=portfolio.name,
        created_at=created_str,
        objective=portfolio.objective,
        risk_model=portfolio.risk_model,
        weights=portfolio.weights,
        metrics=portfolio.metrics,
    )
    slug = re.sub(r"[^a-z0-9]+", "-", portfolio.name.lower()).strip("-") or "portfolio"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{slug}.pdf"'},
    )


@router.delete("/portfolios/{portfolio_id}", status_code=204)
async def delete_portfolio(
    portfolio_id: int,
    user: ProfileData = Depends(get_current_user),
    repository: PortfolioRepository = Depends(get_portfolio_repository),
) -> Response:
    if not await repository.delete(user.id, portfolio_id):
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    return Response(status_code=204)
