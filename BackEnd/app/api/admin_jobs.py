from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.admin_auth import require_admin
from app.services.admin_jobs_service import (
    AdminJobError,
    get_job,
    list_allowed_job_types,
    list_jobs,
    submit_job,
)


router = APIRouter(
    prefix="/admin/jobs",
    tags=["Administration"],
    dependencies=[Depends(require_admin)],
)


class AdminJobCreate(BaseModel):
    job_type: str = Field(
        min_length=1,
        max_length=100,
    )
    request_payload: dict[str, Any] = Field(
        default_factory=dict
    )


def _raise_http_error(exc: Exception) -> None:
    raise HTTPException(
        status_code=422,
        detail=str(exc),
    ) from exc


@router.get("/types")
def allowed_job_types():
    return {
        "job_types": list_allowed_job_types(),
    }


@router.post("", status_code=202)
def create_admin_job(payload: AdminJobCreate):
    try:
        return submit_job(
            job_type=payload.job_type,
            request_payload=payload.request_payload,
        )

    except AdminJobError as exc:
        _raise_http_error(exc)


@router.get("")
def admin_job_history(
    limit: int = Query(
        default=25,
        ge=1,
        le=100,
    ),
):
    try:
        jobs = list_jobs(limit=limit)

        return {
            "count": len(jobs),
            "jobs": jobs,
        }

    except AdminJobError as exc:
        _raise_http_error(exc)


@router.get("/{job_id}")
def admin_job_detail(job_id: int):
    try:
        return get_job(job_id)

    except AdminJobError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
