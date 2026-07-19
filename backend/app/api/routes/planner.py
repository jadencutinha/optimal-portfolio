from fastapi import APIRouter

from app.planner.montecarlo import sensitivity_levers, simulate, solve_contribution, solve_years
from app.schemas.planner import (
    LeverSchema,
    PlanPointSchema,
    PlanRequest,
    PlanResponse,
    SuccessPointSchema,
)

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

    # The reverse solver and sensitivity levers only make sense once there's a goal.
    solved_monthly: float | None = None
    solved_years: int | None = None
    levers: list[LeverSchema] = []
    if request.target is not None:
        solved_monthly = solve_contribution(
            expected_return=request.expected_return,
            volatility=request.volatility,
            initial=request.initial,
            years=request.years,
            target=request.target,
            confidence=request.solve_confidence,
            current_monthly=request.monthly_contribution,
        )
        solved_years = solve_years(
            expected_return=request.expected_return,
            volatility=request.volatility,
            initial=request.initial,
            monthly_contribution=request.monthly_contribution,
            target=request.target,
            confidence=request.solve_confidence,
        )
        levers = [
            LeverSchema(label=lever.label, delta=lever.delta)
            for lever in sensitivity_levers(
                expected_return=request.expected_return,
                volatility=request.volatility,
                initial=request.initial,
                monthly_contribution=request.monthly_contribution,
                years=request.years,
                target=request.target,
            )
        ]

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
        solve_confidence=request.solve_confidence,
        solved_monthly=solved_monthly,
        solved_years=solved_years,
        median_months_to_goal=result.median_months_to_goal,
        success_over_time=[
            SuccessPointSchema(month=point.month, prob=point.prob) for point in result.success_over_time
        ],
        levers=levers,
    )
