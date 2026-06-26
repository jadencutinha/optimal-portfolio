from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import frontier, health, optimize, prices, universe
from app.config import get_settings
from app.data.cache import build_cache
from app.data.provider import CachingDataProvider, build_inner_provider
from app.data.repository import PriceRepository
from app.data.sectors import SectorProvider
from app.db.session import create_engine, create_session_factory, init_models
from app.optimizer.repository import OptimizationRepository


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
    app.state.optimization_repository = OptimizationRepository(session_factory)
    app.state.price_repository = PriceRepository(session_factory)

    try:
        yield
    finally:
        await provider.close()
        await cache.close()
        await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(universe.router, prefix=settings.api_prefix)
    app.include_router(prices.router, prefix=settings.api_prefix)
    app.include_router(optimize.router, prefix=settings.api_prefix)
    app.include_router(frontier.router, prefix=settings.api_prefix)
    return app


app = create_app()
