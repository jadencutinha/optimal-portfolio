import asyncio
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

ReportFn = Callable[[dict], Awaitable[None]]
Runner = Callable[[ReportFn], Awaitable[dict]]


@dataclass
class Job:
    id: str
    total: int
    status: str = "running"
    progress: float = 0.0
    completed: int = 0
    result: dict | None = None
    error: str | None = None
    subscribers: list[asyncio.Queue] = field(default_factory=list)


class JobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}

    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def submit(self, total: int, runner: Runner) -> Job:
        job = Job(id=uuid.uuid4().hex, total=total)
        self._jobs[job.id] = job
        asyncio.create_task(self._run(job, runner))
        return job

    async def _run(self, job: Job, runner: Runner) -> None:
        async def report(event: dict) -> None:
            if "completed" in event:
                job.completed = event["completed"]
                job.progress = job.completed / job.total if job.total else 1.0
            await self._broadcast(
                job,
                {"type": "progress", "progress": job.progress, "completed": job.completed, "total": job.total, **event},
            )

        try:
            job.result = await runner(report)
            job.status = "done"
            await self._broadcast(
                job, {"type": "done", "progress": 1.0, "completed": job.total, "total": job.total}
            )
        except Exception as error:  # noqa: BLE001
            job.status = "error"
            job.error = str(error)
            await self._broadcast(job, {"type": "error", "message": str(error)})

    async def _broadcast(self, job: Job, event: dict) -> None:
        for queue in list(job.subscribers):
            await queue.put(event)

    def subscribe(self, job: Job) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        job.subscribers.append(queue)
        return queue

    def unsubscribe(self, job: Job, queue: asyncio.Queue) -> None:
        if queue in job.subscribers:
            job.subscribers.remove(queue)
