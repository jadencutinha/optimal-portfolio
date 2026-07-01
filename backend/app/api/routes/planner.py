from fastapi import APIRouter

from app.planner.montecarlo import simulate
from app.schemas.planner import PlanPointSchema, PlanRequest, PlanResponse

router = APIRouter(tags=["planner"])


@router.post("/plan/montecarlo", response_model=PlanResponse)
async def monte_carlo(request: PlanRequest) -> PlanResponse:
    result = simulate(
        expected_return=request.expected_return,
        volatility=request.volatility,
        initial=request.initial,
        monthly_contribution=request.monthly_contribution,
        years=request.years,
        target=request.target,
        trials=request.trials,
        large_drawdown=request.large_drawdown,
        seed=request.seed,
    )
    return PlanResponse(
        years=request.years,
        months=request.years * 12,
        trials=request.trials,
        target=request.target,
        total_contributions=result.total_contributions,
        prob_success=result.prob_success,
        prob_large_drawdown=result.prob_large_drawdown,
        large_drawdown=request.large_drawdown,
        median_final=result.median_final,
        mean_final=result.mean_final,
        p10_final=result.p10_final,
        p90_final=result.p90_final,
        timeline=[
            PlanPointSchema(
                month=point.month,
                p10=point.p10,
                p25=point.p25,
                p50=point.p50,
                p75=point.p75,
                p90=point.p90,
            )
            for point in result.timeline
        ],
    )
