from __future__ import annotations

from pydantic import BaseModel, Field


class GamePlayer(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)
    tickers: list[str] = Field(..., min_length=1, max_length=8)


class GameRequest(BaseModel):
    players: list[GamePlayer] = Field(..., min_length=2, max_length=6)
    years: int = Field(10, ge=1, le=30)
    seed: int | None = None


class GamePathPoint(BaseModel):
    month: int
    value: float


class GamePlayerResult(BaseModel):
    name: str
    tickers: list[str]
    resolved_tickers: list[str]
    start_value: float
    final_value: float
    return_pct: float
    cagr: float
    best_ticker: str | None = None
    win_probability: float = 0.0
    median_final: float = 0.0
    p10_final: float = 0.0
    p90_final: float = 0.0
    volatility: float = 0.0
    resilience: float = 0.0
    path: list[GamePathPoint]


class GameAward(BaseModel):
    category: str
    label: str
    player_index: int
    detail: str


class GameMeta(BaseModel):
    simulations: int
    data_source: str
    history_years: int
    source: str
    method: str
    credibility: str


class GameResponse(BaseModel):
    years: int
    months: int
    start_value: float
    winner_index: int
    players: list[GamePlayerResult]
    awards: list[GameAward] = []
    meta: GameMeta | None = None


class CreateRoomRequest(BaseModel):
    host_name: str = Field(..., min_length=1, max_length=40)
    years: int = Field(10, ge=1, le=30)


class JoinRoomRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)


class PicksRequest(BaseModel):
    player_id: str
    tickers: list[str] = Field(default_factory=list, max_length=8)


class StartRoomRequest(BaseModel):
    player_id: str


class ReadyRequest(BaseModel):
    player_id: str
    ready: bool = True


class RoomPlayerState(BaseModel):
    id: str
    name: str
    is_host: bool
    pick_count: int
    ready: bool


class RoomState(BaseModel):
    code: str
    status: str
    years: int
    players: list[RoomPlayerState]
    result: GameResponse | None = None
    seconds_remaining: int | None = None


class CreateRoomResponse(BaseModel):
    code: str
    player_id: str
    room: RoomState


class JoinRoomResponse(BaseModel):
    player_id: str
    room: RoomState
