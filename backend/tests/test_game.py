from fastapi.testclient import TestClient


def test_game_simulate_returns_paths_and_a_winner(client: TestClient) -> None:
    body = {
        "players": [
            {"name": "Ava", "tickers": ["AAPL", "MSFT", "GOOGL"]},
            {"name": "Ben", "tickers": ["AMZN", "JPM", "KO"]},
        ],
        "years": 10,
        "seed": 42,
    }
    response = client.post("/api/game/simulate", json=body)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["months"] == 120
    assert data["start_value"] == 10000.0
    assert len(data["players"]) == 2
    assert data["winner_index"] in (0, 1)

    finals = [player["final_value"] for player in data["players"]]
    assert data["winner_index"] == finals.index(max(finals))

    for player in data["players"]:
        assert len(player["path"]) == 121
        assert player["path"][0]["value"] == 10000.0
        assert player["path"][0]["month"] == 0
        assert player["path"][-1]["month"] == 120


def test_game_simulate_is_reproducible_with_a_seed(client: TestClient) -> None:
    body = {
        "players": [
            {"name": "A", "tickers": ["AAPL", "MSFT"]},
            {"name": "B", "tickers": ["GOOGL", "AMZN"]},
        ],
        "years": 5,
        "seed": 7,
    }
    first = client.post("/api/game/simulate", json=body).json()
    second = client.post("/api/game/simulate", json=body).json()
    assert first["players"][0]["final_value"] == second["players"][0]["final_value"]


def test_game_needs_at_least_two_players(client: TestClient) -> None:
    body = {"players": [{"name": "Solo", "tickers": ["AAPL"]}], "years": 10}
    response = client.post("/api/game/simulate", json=body)
    assert response.status_code == 422


def test_room_flow_create_join_start(client: TestClient) -> None:
    created = client.post("/api/game/rooms", json={"host_name": "Host", "years": 10})
    assert created.status_code == 200, created.text
    room = created.json()
    code = room["code"]
    host_id = room["player_id"]
    assert len(code) == 4

    # The 20 second countdown starts the moment the room (game link) is created.
    state = client.get(f"/api/game/rooms/{code}").json()
    assert state["status"] == "countdown"
    assert 0 < state["seconds_remaining"] <= 20

    joined = client.post(f"/api/game/rooms/{code}/join", json={"name": "Guest"})
    assert joined.status_code == 200, joined.text
    guest_id = joined.json()["player_id"]

    client.post(f"/api/game/rooms/{code}/picks", json={"player_id": host_id, "tickers": ["AAPL", "MSFT"]})
    client.post(f"/api/game/rooms/{code}/picks", json={"player_id": guest_id, "tickers": ["GOOGL", "AMZN"]})

    # Only players who readied up are included, so picks alone are not enough to start.
    assert client.post(f"/api/game/rooms/{code}/start", json={"player_id": host_id}).status_code == 400

    client.post(f"/api/game/rooms/{code}/ready", json={"player_id": host_id, "ready": True})
    client.post(f"/api/game/rooms/{code}/ready", json={"player_id": guest_id, "ready": True})

    state = client.get(f"/api/game/rooms/{code}").json()
    assert len(state["players"]) == 2
    assert all(p["ready"] for p in state["players"])
    assert all(p["pick_count"] == 2 for p in state["players"])

    # only host can start
    assert client.post(f"/api/game/rooms/{code}/start", json={"player_id": guest_id}).status_code == 403

    started = client.post(f"/api/game/rooms/{code}/start", json={"player_id": host_id})
    assert started.status_code == 200, started.text
    done = started.json()
    assert done["status"] == "done"
    assert done["result"]["winner_index"] in (0, 1)
    assert len(done["result"]["awards"]) >= 4
    assert done["result"]["meta"]["simulations"] >= 100


def test_room_unknown_code_is_404(client: TestClient) -> None:
    assert client.get("/api/game/rooms/ZZZZ").status_code == 404


def test_auto_start_claims_once_when_countdown_expires() -> None:
    import asyncio
    import time

    from app.game.rooms import RoomStore

    async def flow() -> None:
        store = RoomStore()
        room, host = await store.create("Host", 10)
        _, guest = await store.join(room.code, "Guest")
        await store.set_picks(room.code, host, ["AAPL", "MSFT"])
        await store.set_picks(room.code, guest, ["GOOGL", "AMZN"])

        # Expired, but nobody has readied yet, so there is nothing to start.
        room.starts_at = time.time() - 1
        assert await store.begin_if_due(room.code) is None

        await store.set_ready(room.code, host, True)
        await store.set_ready(room.code, guest, True)
        room.starts_at = time.time() - 1

        ready = await store.begin_if_due(room.code)
        assert ready is not None
        assert len(ready) == 2
        # The claim flips the room to running, so a second poll does not re-trigger.
        assert room.status == "running"
        assert await store.begin_if_due(room.code) is None

    asyncio.run(flow())
