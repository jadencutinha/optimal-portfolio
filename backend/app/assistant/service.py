from pydantic import ValidationError

from app.assistant.client import AssistantError, call_agent, call_text, resolved_model
from app.config import Settings
from app.data.provider import DataProvider
from app.optimizer.service import OptimizationServiceError, run_optimization
from app.schemas.assistant import (
    AssistantConfig,
    AssistantRequest,
    AssistantResponse,
    CourseAssistantRequest,
    CourseAssistantResponse,
)
from app.schemas.optimize import OptimizeRequest, OptimizeResponse

DEFAULT_UNIVERSE = ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "JNJ", "XOM", "KO"]

_OBJECTIVES = {
    "min_variance",
    "max_sharpe",
    "target_return",
    "target_risk",
    "risk_parity",
    "max_diversification",
    "cvar",
    "cost_aware",
}
_RISK_MODELS = {"sample", "ledoit_wolf", "ewma", "factor"}
_RETURN_MODELS = {"historical", "black_litterman"}

CONFIG_SYSTEM = (
    "You are the portfolio configuration engine for Halo, a convex mean-variance "
    "optimizer. Convert the investor's plain-English goal into one configuration by calling "
    "the configure_portfolio tool. Guidance: use max_sharpe for the best risk-adjusted returns "
    "or growth; min_variance or target_risk for safe / low-risk goals; risk_parity or "
    "max_diversification for balanced, well-diversified portfolios; cvar to protect against "
    "crashes and tail risk; target_return when a specific annual return is named. Use a lower "
    "max_weight (0.20-0.30) when the investor wants diversification and a higher one (0.40-0.60) "
    "when they want concentration. Prefer the ledoit_wolf risk model for stability unless the "
    "goal implies otherwise. Only choose tickers from the provided universe."
)

EXPLAIN_SYSTEM = (
    "You are a portfolio education assistant for Halo. Given an optimization result, "
    "explain in plain English (2-3 short paragraphs) what the portfolio does, why it fits the "
    "investor's goal, and the return-versus-risk trade-off, then end with one honest caveat. "
    "Reference the Sharpe ratio, expected return, and volatility. Do not use markdown headers "
    "or bullet points. Be concise, encouraging, and honest."
)

AGENT_SYSTEM = (
    "You are Halo's investing assistant, friendly, knowledgeable, and conversational. "
    "Reply naturally to whatever the user says. Greet them back when greeted, and answer general or "
    "investing questions directly and concisely in plain English. "
    "You also have a configure_portfolio tool that builds an optimized portfolio, but only call it when the "
    "user clearly asks you to build, optimize, design, or suggest a portfolio or allocation. For anything "
    "else, including greetings, small talk, and general questions, just reply with a helpful text answer and "
    "do NOT call the tool. When you do build a portfolio, only use tickers from the provided universe, prefer "
    "max_sharpe for growth, min_variance or target_risk for safety, risk_parity or max_diversification for "
    "balance, and cvar for crash protection. Keep answers concise and do not use markdown headers."
)

CONFIGURE_TOOL = {
    "name": "configure_portfolio",
    "description": "Translate the investor's goal into a portfolio optimization configuration.",
    "input_schema": {
        "type": "object",
        "properties": {
            "objective": {
                "type": "string",
                "enum": sorted(_OBJECTIVES),
                "description": "The optimization objective that best matches the goal.",
            },
            "risk_model": {
                "type": "string",
                "enum": sorted(_RISK_MODELS),
                "description": "Covariance estimator. Default ledoit_wolf for stability.",
            },
            "return_model": {
                "type": "string",
                "enum": sorted(_RETURN_MODELS),
                "description": "Expected-return model. Use black_litterman for equilibrium-anchored views.",
            },
            "tickers": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Subset of the available universe to invest in. Omit to use all of them.",
            },
            "max_weight": {
                "type": "number",
                "description": "Maximum weight per holding as a decimal between 0 and 1.",
            },
            "target_return": {
                "type": ["number", "null"],
                "description": "Annual return target as a decimal, required when objective is target_return.",
            },
            "target_risk": {
                "type": ["number", "null"],
                "description": "Annual volatility target as a decimal, required when objective is target_risk.",
            },
            "cvar_alpha": {
                "type": "number",
                "description": "CVaR confidence level between 0.8 and 0.99.",
            },
            "risk_aversion": {
                "type": "number",
                "description": "Risk-aversion coefficient for cost-aware objectives.",
            },
            "lookback_days": {
                "type": ["integer", "null"],
                "description": "History window in days (30-3650).",
            },
            "rationale": {
                "type": "string",
                "description": "One or two sentences on why this configuration fits the goal.",
            },
        },
        "required": ["objective", "risk_model", "max_weight", "rationale"],
    },
}


def resolve_universe(tickers: list[str] | None) -> list[str]:
    if not tickers:
        return list(DEFAULT_UNIVERSE)
    seen: set[str] = set()
    cleaned: list[str] = []
    for ticker in tickers:
        symbol = ticker.strip().upper()
        if symbol and symbol not in seen:
            seen.add(symbol)
            cleaned.append(symbol)
    return cleaned if len(cleaned) >= 2 else list(DEFAULT_UNIVERSE)


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def build_optimize_request(tool_input: dict, universe: list[str]) -> OptimizeRequest:
    universe_set = set(universe)
    raw = tool_input.get("tickers") or []
    chosen = [t.strip().upper() for t in raw if isinstance(t, str) and t.strip()]
    tickers = [t for t in chosen if t in universe_set]
    if len(tickers) < 2:
        tickers = list(universe)

    objective = tool_input.get("objective")
    if objective not in _OBJECTIVES:
        objective = "max_sharpe"
    risk_model = tool_input.get("risk_model")
    if risk_model not in _RISK_MODELS:
        risk_model = "ledoit_wolf"
    return_model = tool_input.get("return_model")
    if return_model not in _RETURN_MODELS:
        return_model = "historical"

    target_return = tool_input.get("target_return")
    target_risk = tool_input.get("target_risk")
    if objective == "target_return" and not isinstance(target_return, (int, float)):
        objective = "max_sharpe"
    if objective == "target_risk" and not isinstance(target_risk, (int, float)):
        objective = "max_sharpe"

    try:
        max_weight = float(tool_input.get("max_weight", 0.35))
    except (TypeError, ValueError):
        max_weight = 0.35
    max_weight = _clamp(max_weight, 1.0 / len(tickers), 1.0)

    data: dict = {
        "tickers": tickers,
        "objective": objective,
        "risk_model": risk_model,
        "return_model": return_model,
        "max_weight": max_weight,
    }
    if objective == "target_return":
        data["target_return"] = _clamp(float(target_return), -1.0, 2.0)
    if objective == "target_risk":
        data["target_risk"] = _clamp(float(target_risk), 0.01, 2.0)
    if isinstance(tool_input.get("cvar_alpha"), (int, float)):
        data["cvar_alpha"] = _clamp(float(tool_input["cvar_alpha"]), 0.8, 0.99)
    if isinstance(tool_input.get("risk_aversion"), (int, float)):
        data["risk_aversion"] = _clamp(float(tool_input["risk_aversion"]), 0.1, 100.0)
    if isinstance(tool_input.get("lookback_days"), int):
        data["lookback_days"] = int(_clamp(float(tool_input["lookback_days"]), 30, 3650))

    try:
        return OptimizeRequest(**data)
    except ValidationError as error:
        raise AssistantError("The assistant produced an invalid configuration. Try rephrasing.", 502) from error


def _result_summary(goal: str, request: OptimizeRequest, result: OptimizeResponse) -> str:
    weights = ", ".join(
        f"{allocation.ticker} {allocation.weight * 100:.1f}%" for allocation in result.weights
    )
    metrics = result.metrics
    return (
        f"Investor goal: {goal}\n"
        f"Objective: {request.objective}; risk model: {request.risk_model}; "
        f"per-holding cap: {request.max_weight * 100:.0f}%.\n"
        f"Expected annual return: {metrics.expected_return * 100:.1f}%; "
        f"volatility: {metrics.volatility * 100:.1f}%; "
        f"Sharpe ratio: {metrics.sharpe_ratio:.2f}.\n"
        f"Allocation: {weights}.\n"
        "Explain this portfolio to the investor."
    )


async def run_assistant(
    request: AssistantRequest,
    provider: DataProvider,
    settings: Settings,
    universe: list[str],
    sectors: dict[str, str] | None = None,
) -> AssistantResponse:
    user_prompt = (
        f"{request.message}\n\n"
        f"(If, and only if, you build a portfolio, choose from these tickers: {', '.join(universe)}.)"
    )
    tool_input, text = await call_agent(settings, system=AGENT_SYSTEM, user=user_prompt, tool=CONFIGURE_TOOL)

    if tool_input is None:
        reply = text or "I'm here to help. Ask me anything about investing, or ask me to build you a portfolio."
        return AssistantResponse(model=resolved_model(settings), reply=reply)

    opt_request = build_optimize_request(tool_input, universe)
    try:
        result, _ = await run_optimization(opt_request, provider, settings, sectors)
    except OptimizationServiceError as error:
        raise AssistantError(error.message, error.status_code) from error

    explanation = (
        await call_text(settings, system=EXPLAIN_SYSTEM, user=_result_summary(request.message, opt_request, result))
        or "Here is the portfolio built for your goal."
    )

    config = AssistantConfig(
        tickers=opt_request.tickers,
        objective=opt_request.objective,
        risk_model=opt_request.risk_model,
        return_model=opt_request.return_model,
        max_weight=opt_request.max_weight,
        target_return=opt_request.target_return,
        target_risk=opt_request.target_risk,
        cvar_alpha=opt_request.cvar_alpha,
        risk_aversion=opt_request.risk_aversion,
        lookback_days=opt_request.lookback_days,
    )
    return AssistantResponse(
        model=resolved_model(settings),
        reply=text.strip(),
        rationale=str(tool_input.get("rationale", "")).strip(),
        explanation=explanation,
        config=config,
        result=result,
    )


COURSE_SYSTEM = (
    "You are Halo's course assistant, a friendly personal-finance and investing tutor. "
    "Answer general financial-literacy and money questions in plain English, 2-4 short "
    "sentences: saving vs investing, emergency funds, short-term savings goals, budgeting, "
    "how markets/indexes/bonds work, etc. You are NOT the portfolio optimizer: never "
    "recommend specific stocks, tickers, or percentage allocations — if asked to build a "
    "portfolio, point them to Halo's Portfolio assistant instead. When relevant, tie your "
    "answer back to a concept from the course."
)


async def run_course_assistant(request: CourseAssistantRequest, settings: Settings) -> CourseAssistantResponse:
    context = ""
    if request.module_title:
        context = f'The student is on the lesson "{request.module_title}"'
        context += f' in the track "{request.track_title}".\n\n' if request.track_title else ".\n\n"
    reply = await call_text(settings, system=COURSE_SYSTEM, user=f"{context}Student question: {request.message}")
    return CourseAssistantResponse(
        model=resolved_model(settings),
        reply=reply or "I couldn't come up with an answer to that — try rephrasing.",
    )
