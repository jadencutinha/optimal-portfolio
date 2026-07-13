import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    assistant,
    backtest,
    behavioral,
    courses,
    frontier,
    health,
    invest,
    market,
    me,
    metrics as metrics_route,
    optimize,
    planner,
    portfolios,
    prices,
    reports,
    stress,
    tickers,
    universe,
)
from app.auth.repository import ProfileRepository
from app.auth.supabase import SupabaseAdmin, SupabaseVerifier
from app.backtest.repository import BacktestRepository
from app.config import get_settings
from app.data.cache import build_cache
from app.data.provider import CachingDataProvider, ProviderError, build_inner_provider
from app.data.repository import PriceRepository
from app.data.sectors import SectorProvider
from app.db.session import create_engine, create_session_factory, init_models
from app.education.repository import CourseRepository
from app.observability.metrics import MetricsCollector
from app.observability.sentry import capture_exception, init_sentry
from app.optimizer.repository import OptimizationRepository
from app.portfolios.repository import PortfolioRepository

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("optimal_portfolio")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings

    engine = create_engine(settings.database_url)
    session_factory = create_session_factory(engine)
    try:
        await init_models(engine)
    except Exception:
        pass

    cache = await build_cache(settings.redis_url)
    provider = CachingDataProvider(build_inner_provider(settings), cache, settings.cache_ttl_seconds)

    app.state.cache = cache
    app.state.provider = provider
    app.state.sector_provider = SectorProvider(cache, settings)
    app.state.verifier = SupabaseVerifier(settings)
    app.state.supabase_admin = SupabaseAdmin(settings)
    app.state.profile_repository = ProfileRepository(session_factory)
    app.state.optimization_repository = OptimizationRepository(session_factory)
    app.state.price_repository = PriceRepository(session_factory)
    app.state.backtest_repository = BacktestRepository(session_factory)
    app.state.course_repository = CourseRepository(session_factory)
    app.state.portfolio_repository = PortfolioRepository(session_factory)

    try:
        yield
    finally:
        await provider.close()
        await cache.close()
        await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    init_sentry(settings.sentry_dsn, settings.environment, settings.sentry_traces_sample_rate)
    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
    app.state.metrics = MetricsCollector()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        app.state.metrics.record(request.method, request.url.path, response.status_code, elapsed)
        logger.info("%s %s -> %s (%.1fms)", request.method, request.url.path, response.status_code, elapsed)
        return response

    @app.exception_handler(ProviderError)
    async def provider_error_handler(request: Request, exc: ProviderError) -> JSONResponse:
        logger.warning("Market data provider error on %s %s: %s", request.method, request.url.path, exc.message)
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        app.state.metrics.record(request.method, request.url.path, 500, 0.0)
        capture_exception(exc)
        return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(universe.router, prefix=settings.api_prefix)
    app.include_router(prices.router, prefix=settings.api_prefix)
    app.include_router(optimize.router, prefix=settings.api_prefix)
    app.include_router(frontier.router, prefix=settings.api_prefix)
    app.include_router(me.router, prefix=settings.api_prefix)
    app.include_router(backtest.router, prefix=settings.api_prefix)
    app.include_router(courses.router, prefix=settings.api_prefix)
    app.include_router(portfolios.router, prefix=settings.api_prefix)
    app.include_router(planner.router, prefix=settings.api_prefix)
    app.include_router(behavioral.router, prefix=settings.api_prefix)
    app.include_router(assistant.router, prefix=settings.api_prefix)
    app.include_router(stress.router, prefix=settings.api_prefix)
    app.include_router(reports.router, prefix=settings.api_prefix)
    app.include_router(invest.router, prefix=settings.api_prefix)
    app.include_router(market.router, prefix=settings.api_prefix)
    app.include_router(tickers.router, prefix=settings.api_prefix)
    app.include_router(metrics_route.router, prefix=settings.api_prefix)
    return app


app = create_app()
