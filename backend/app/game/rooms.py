from __future__ import annotations

import asyncio
import secrets
import time
from dataclasses import dataclass, field

from app.schemas.game import GameResponse

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 4
ROOM_TTL_SECONDS = 3 * 3600
MAX_PLAYERS = 6
COUNTDOWN_SECONDS = 20


class RoomError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class RoomPlayer:
    id: str
    name: str
    is_host: bool
    tickers: list[str] = field(default_factory=list)
    ready: bool = False


@dataclass
class Room:
    code: str
    host_id: str
    years: int
    status: str
    players: dict[str, RoomPlayer]
    order: list[str]
    created_at: float
    result: GameResponse | None = None
    starts_at: float | None = None

    def seconds_remaining(self) -> int | None:
        if self.status != "countdown" or self.starts_at is None:
            return None
        return max(0, int(round(self.starts_at - time.time())))


class RoomStore:
    def __init__(self) -> None:
        self._rooms: dict[str, Room] = {}
        self._lock = asyncio.Lock()

    def _prune(self) -> None:
        now = time.time()
        for code in [c for c, room in self._rooms.items() if now - room.created_at > ROOM_TTL_SECONDS]:
            self._rooms.pop(code, None)

    def _new_code(self) -> str:
        while True:
            code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
            if code not in self._rooms:
                return code

    async def create(self, host_name: str, years: int) -> tuple[Room, str]:
        async with self._lock:
            self._prune()
            code = self._new_code()
            player_id = secrets.token_hex(6)
            host = RoomPlayer(id=player_id, name=host_name.strip() or "Host", is_host=True)
            now = time.time()
            room = Room(
                code=code,
                host_id=player_id,
                years=years,
                status="countdown",
                players={player_id: host},
                order=[player_id],
                created_at=now,
                starts_at=now + COUNTDOWN_SECONDS,
            )
            self._rooms[code] = room
            return room, player_id

    async def get(self, code: str) -> Room:
        async with self._lock:
            room = self._rooms.get(code.strip().upper())
            if room is None:
                raise RoomError("That game code was not found. Check it and try again.", 404)
            return room

    async def join(self, code: str, name: str) -> tuple[Room, str]:
        async with self._lock:
            room = self._rooms.get(code.strip().upper())
            if room is None:
                raise RoomError("That game code was not found.", 404)
            if room.status == "done":
                raise RoomError("That game has already finished.", 409)
            if len(room.players) >= MAX_PLAYERS:
                raise RoomError("That game is full.", 409)
            player_id = secrets.token_hex(6)
            room.players[player_id] = RoomPlayer(id=player_id, name=name.strip() or "Player", is_host=False)
            room.order.append(player_id)
            return room, player_id

    async def set_picks(self, code: str, player_id: str, tickers: list[str]) -> Room:
        async with self._lock:
            room = self._rooms.get(code.strip().upper())
            if room is None or player_id not in room.players:
                raise RoomError("You are not in this game anymore.", 404)
            clean = [ticker.strip().upper() for ticker in tickers if ticker.strip()][:8]
            room.players[player_id].tickers = clean
            room.players[player_id].ready = False
            return room

    async def set_ready(self, code: str, player_id: str, ready: bool) -> Room:
        async with self._lock:
            room = self._rooms.get(code.strip().upper())
            if room is None or player_id not in room.players:
                raise RoomError("You are not in this game anymore.", 404)
            player = room.players[player_id]
            if ready and not player.tickers:
                raise RoomError("Pick at least one stock before you ready up.", 400)
            player.ready = ready
            return room

    async def leave(self, code: str, player_id: str) -> Room | None:
        async with self._lock:
            room = self._rooms.get(code.strip().upper())
            if room is None:
                return None
            room.players.pop(player_id, None)
            if player_id in room.order:
                room.order.remove(player_id)
            return room

    async def begin_if_due(self, code: str) -> list[RoomPlayer] | None:
        """Atomically claim the auto-start once the countdown has expired.

        Returns the ready roster to simulate, or None if the game is not due yet,
        already started, or does not have at least two ready players. Flipping the
        status to ``running`` inside the lock means only one poll ever triggers the
        simulation, no matter how many clients are polling.
        """
        async with self._lock:
            room = self._rooms.get(code.strip().upper())
            if room is None or room.status != "countdown":
                return None
            if room.starts_at is None or time.time() < room.starts_at:
                return None
            ready = [
                room.players[pid]
                for pid in room.order
                if pid in room.players and room.players[pid].ready and room.players[pid].tickers
            ]
            if len(ready) < 2:
                return None
            room.status = "running"
            return ready

    async def set_result(self, code: str, result: GameResponse) -> Room:
        async with self._lock:
            room = self._rooms.get(code.strip().upper())
            if room is None:
                raise RoomError("That game code was not found.", 404)
            room.status = "done"
            room.result = result
            return room
