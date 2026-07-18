from fastapi import APIRouter
from pydantic import BaseModel
from app.jobs.queue import enqueue_job

class RefreshOddsRequest(BaseModel):
    season: int
    week: int

router = APIRouter(prefix="/admin/jobs", tags=["Admin Jobs"])

@router.get("")
def get_jobs(): return {"status": "ok"}

@router.post("/refresh-odds")
async def trigger_refresh(request: RefreshOddsRequest):
    job_id = enqueue_job("market_odds_sync", {"season": request.season, "week": request.week})
    return {"status": "queued", "job_id": job_id}
