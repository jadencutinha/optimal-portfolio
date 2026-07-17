from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import get_provider, get_room_store
from app.data.provider import DataProvider
from app.game.rooms import Room, RoomError, RoomStore
from app.game.service import simulate_game
from app.ratelimit import HEAVY, limiter
from app.schemas.game import (
    CreateRoomRequest,
    CreateRoomResponse,
    GameRequest,
    GameResponse,
    JoinRoomRequest,
    JoinRoomResponse,
    PicksRequest,
    ReadyRequest,
    RoomPlayerState,
    RoomState,
    StartRoomRequest,
)

router = APIRouter(tags=["game"])


def _room_state(room: Room) -> RoomState:
    return RoomState(
        code=room.code,
        status=room.status,
        years=room.years,
        result=room.result,
        players=[
            RoomPlayerState(
                id=player.id,
                name=player.name,
                is_host=player.is_host,
                pick_count=len(player.tickers),
                ready=player.ready,
            )
            for player in (room.players[pid] for pid in room.order if pid in room.players)
        ],
    )


@router.post("/game/simulate", response_model=GameResponse)
@limiter.limit(HEAVY)
async def simulate(
    request: Request,
    payload: GameRequest,
    provider: DataProvider = Depends(get_provider),
) -> GameResponse:
    return await simulate_game(payload, provider)


@router.post("/game/rooms", response_model=CreateRoomResponse)
async def create_room(
    payload: CreateRoomRequest,
    store: RoomStore = Depends(get_room_store),
) -> CreateRoomResponse:
    room, player_id = await store.create(payload.host_name, payload.years)
    return CreateRoomResponse(code=room.code, player_id=player_id, room=_room_state(room))


@router.get("/game/rooms/{code}", response_model=RoomState)
async def get_room(code: str, store: RoomStore = Depends(get_room_store)) -> RoomState:
    try:
        room = await store.get(code)
    except RoomError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return _room_state(room)


@router.post("/game/rooms/{code}/join", response_model=JoinRoomResponse)
async def join_room(
    code: str,
    payload: JoinRoomRequest,
    store: RoomStore = Depends(get_room_store),
) -> JoinRoomResponse:
    try:
        room, player_id = await store.join(code, payload.name)
    except RoomError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return JoinRoomResponse(player_id=player_id, room=_room_state(room))


@router.post("/game/rooms/{code}/picks", response_model=RoomState)
async def set_picks(
    code: str,
    payload: PicksRequest,
    store: RoomStore = Depends(get_room_store),
) -> RoomState:
    try:
        room = await store.set_picks(code, payload.player_id, payload.tickers)
    except RoomError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return _room_state(room)


@router.post("/game/rooms/{code}/ready", response_model=RoomState)
async def set_ready(
    code: str,
    payload: ReadyRequest,
    store: RoomStore = Depends(get_room_store),
) -> RoomState:
    try:
        room = await store.set_ready(code, payload.player_id, payload.ready)
    except RoomError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return _room_state(room)


@router.post("/game/rooms/{code}/leave", response_model=dict)
async def leave_room(
    code: str,
    payload: StartRoomRequest,
    store: RoomStore = Depends(get_room_store),
) -> dict:
    await store.leave(code, payload.player_id)
    return {"left": True}


@router.post("/game/rooms/{code}/start", response_model=RoomState)
@limiter.limit(HEAVY)
async def start_room(
    request: Request,
    code: str,
    payload: StartRoomRequest,
    store: RoomStore = Depends(get_room_store),
    provider: DataProvider = Depends(get_provider),
) -> RoomState:
    try:
        room = await store.get(code)
    except RoomError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    if payload.player_id != room.host_id:
        raise HTTPException(status_code=403, detail="Only the host can start the game.")

    roster = [room.players[pid] for pid in room.order if pid in room.players]
    if len(roster) < 2:
        raise HTTPException(status_code=400, detail="Need at least two players to start.")
    if not all(player.ready for player in roster):
        raise HTTPException(status_code=400, detail="Everyone needs to ready up before the game can start.")

    players = [{"name": player.name, "tickers": player.tickers} for player in roster]

    result = await simulate_game(GameRequest(players=players, years=room.years), provider)
    room = await store.set_result(code, result)
    return _room_state(room)
