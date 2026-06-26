from fastapi import Request

from app.config import Settings
from app.data.provider import DataProvider
from app.data.repository import PriceRepository
from app.data.sectors import SectorProvider
from app.optimizer.repository import OptimizationRepository


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_provider(request: Request) -> DataProvider:
    return request.app.state.provider


def get_sector_provider(request: Request) -> SectorProvider:
    return request.app.state.sector_provider


def get_optimization_repository(request: Request) -> OptimizationRepository:
    return request.app.state.optimization_repository


def get_price_repository(request: Request) -> PriceRepository:
    return request.app.state.price_repository
