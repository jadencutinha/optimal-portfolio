import time
from typing import Protocol

try:
    from redis.asyncio import Redis
except ImportError:
    Redis = None


class Cache(Protocol):
    async def get(self, key: str) -> str | None: ...

    async def set(self, key: str, value: str, ttl: int) -> None: ...

    async def close(self) -> None: ...


class MemoryCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, str]] = {}

    async def get(self, key: str) -> str | None:
        item = self._store.get(key)
        if item is None:
            return None
        expires_at, value = item
        if expires_at < time.time():
            self._store.pop(key, None)
            return None
        return value

    async def set(self, key: str, value: str, ttl: int) -> None:
        self._store[key] = (time.time() + ttl, value)

    async def close(self) -> None:
        self._store.clear()


class RedisCache:
    def __init__(self, client: "Redis") -> None:
        self._client = client

    async def get(self, key: str) -> str | None:
        value = await self._client.get(key)
        if value is None:
            return None
        return value.decode() if isinstance(value, bytes) else value

    async def set(self, key: str, value: str, ttl: int) -> None:
        await self._client.set(key, value, ex=ttl)

    async def close(self) -> None:
        await self._client.aclose()


async def build_cache(redis_url: str | None) -> Cache:
    if redis_url and Redis is not None:
        try:
            client = Redis.from_url(redis_url)
            await client.ping()
            return RedisCache(client)
        except Exception:
            pass
    return MemoryCache()
