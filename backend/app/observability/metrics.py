import re
import threading
from collections import defaultdict

_ID_SEGMENT = re.compile(r"^\d+$")


def _normalize(path: str) -> str:
    parts = [":id" if _ID_SEGMENT.match(part) else part for part in path.split("/")]
    return "/".join(parts)


class MetricsCollector:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.total_requests = 0
        self.total_errors = 0
        self._count: dict[str, int] = defaultdict(int)
        self._latency: dict[str, float] = defaultdict(float)
        self._status: dict[str, int] = defaultdict(int)

    def record(self, method: str, path: str, status_code: int, duration_ms: float) -> None:
        key = f"{method} {_normalize(path)}"
        with self._lock:
            self.total_requests += 1
            self._count[key] += 1
            self._latency[key] += duration_ms
            self._status[str(status_code)] += 1
            if status_code >= 500:
                self.total_errors += 1

    def snapshot(self) -> dict:
        with self._lock:
            endpoints = [
                {
                    "endpoint": key,
                    "count": count,
                    "avg_latency_ms": round(self._latency[key] / count, 2) if count else 0.0,
                }
                for key, count in sorted(self._count.items(), key=lambda item: item[1], reverse=True)
            ]
            return {
                "total_requests": self.total_requests,
                "total_errors": self.total_errors,
                "status_codes": dict(self._status),
                "endpoints": endpoints,
            }
