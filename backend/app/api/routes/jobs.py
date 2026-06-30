from fastapi import APIRouter, Depends, HTTPException, WebSocket

from app.api.deps import get_access, get_job_manager, get_provider, get_settings
from app.auth.gating import Access, require_pro
from app.config import Settings
from app.data.provider import DataProvider
from app.jobs.manager import JobManager
from app.jobs.sweep import run_sweep
from app.schemas.jobs import JobStatus, JobSubmitResponse, SweepRequest

router = APIRouter(tags=["jobs"])


@router.post("/jobs/sweep", response_model=JobSubmitResponse)
async def submit_sweep(
    request: SweepRequest,
    provider: DataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
    access: Access = Depends(get_access),
    manager: JobManager = Depends(get_job_manager),
) -> JobSubmitResponse:
    require_pro(access.entitlements, "Live strategy comparison")
    total = len(request.objectives) * len(request.risk_models)
    if total == 0:
        raise HTTPException(status_code=400, detail="Select at least one objective and risk model.")

    async def runner(report):
        return await run_sweep(request, provider, settings, report)

    job = manager.submit(total, runner)
    return JobSubmitResponse(job_id=job.id, total=total)


@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str, manager: JobManager = Depends(get_job_manager)) -> JobStatus:
    job = manager.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JobStatus(
        id=job.id,
        status=job.status,
        progress=job.progress,
        completed=job.completed,
        total=job.total,
        result=job.result,
        error=job.error,
    )


@router.websocket("/jobs/{job_id}/ws")
async def job_ws(websocket: WebSocket, job_id: str) -> None:
    manager: JobManager = websocket.app.state.job_manager
    await websocket.accept()
    job = manager.get(job_id)
    if job is None:
        await websocket.send_json({"type": "error", "message": "Job not found."})
        await websocket.close()
        return

    queue = manager.subscribe(job)
    try:
        await websocket.send_json(
            {"type": "snapshot", "status": job.status, "progress": job.progress, "completed": job.completed, "total": job.total}
        )
        if job.status in ("done", "error"):
            await websocket.send_json(
                {"type": job.status, "progress": job.progress, "result": job.result, "message": job.error}
            )
            return
        while True:
            event = await queue.get()
            await websocket.send_json(event)
            if event["type"] in ("done", "error"):
                break
    finally:
        manager.unsubscribe(job, queue)
