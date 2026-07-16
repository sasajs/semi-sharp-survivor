from __future__ import annotations

from typing import Any

from psycopg2.extras import Json, RealDictCursor

from app.db import get_connection
from app.jobs.registry import JOB_HANDLERS


class AdminJobError(ValueError):
    pass


# Only explicitly approved operational jobs may be submitted through the API.
ADMIN_ALLOWED_JOB_TYPES = {
    "health_check",
    "nflverse_schedule_refresh",
}


def _serialize_job(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "job_id": row["job_id"],
        "job_type": row["job_type"],
        "job_status": row["job_status"],
        "request_payload": row["request_payload"],
        "result_payload": row["result_payload"],
        "error_message": row["error_message"],
        "created_at": (
            row["created_at"].isoformat()
            if row["created_at"]
            else None
        ),
        "started_at": (
            row["started_at"].isoformat()
            if row["started_at"]
            else None
        ),
        "completed_at": (
            row["completed_at"].isoformat()
            if row["completed_at"]
            else None
        ),
        "worker_id": row["worker_id"],
        "attempt_count": row["attempt_count"],
        "claimed_at": (
            row["claimed_at"].isoformat()
            if row["claimed_at"]
            else None
        ),
    }


def list_allowed_job_types() -> list[str]:
    return sorted(
        job_type
        for job_type in ADMIN_ALLOWED_JOB_TYPES
        if job_type in JOB_HANDLERS
    )


def submit_job(
    job_type: str,
    request_payload: dict[str, Any],
) -> dict[str, Any]:
    normalized_job_type = job_type.strip().lower()

    if normalized_job_type not in ADMIN_ALLOWED_JOB_TYPES:
        raise AdminJobError(
            f"Job type is not approved for administrative execution: "
            f"{normalized_job_type}"
        )

    if normalized_job_type not in JOB_HANDLERS:
        raise AdminJobError(
            f"Approved job type has no registered handler: "
            f"{normalized_job_type}"
        )

    with get_connection() as conn:
        with conn.cursor(
            cursor_factory=RealDictCursor
        ) as cur:
            cur.execute(
                """
                INSERT INTO jobs.job_queue (
                    job_type,
                    request_payload
                )
                VALUES (%s, %s)
                RETURNING
                    job_id,
                    job_type,
                    job_status,
                    request_payload,
                    result_payload,
                    error_message,
                    created_at,
                    started_at,
                    completed_at,
                    worker_id,
                    attempt_count,
                    claimed_at;
                """,
                (
                    normalized_job_type,
                    Json(request_payload),
                ),
            )

            row = cur.fetchone()

    return _serialize_job(dict(row))


def get_job(job_id: int) -> dict[str, Any]:
    with get_connection() as conn:
        with conn.cursor(
            cursor_factory=RealDictCursor
        ) as cur:
            cur.execute(
                """
                SELECT
                    job_id,
                    job_type,
                    job_status,
                    request_payload,
                    result_payload,
                    error_message,
                    created_at,
                    started_at,
                    completed_at,
                    worker_id,
                    attempt_count,
                    claimed_at
                FROM jobs.job_queue
                WHERE job_id = %s;
                """,
                (job_id,),
            )

            row = cur.fetchone()

    if row is None:
        raise AdminJobError(
            f"Administrative job does not exist: {job_id}"
        )

    return _serialize_job(dict(row))


def list_jobs(limit: int = 25) -> list[dict[str, Any]]:
    if limit < 1 or limit > 100:
        raise AdminJobError(
            "Job list limit must be between 1 and 100."
        )

    with get_connection() as conn:
        with conn.cursor(
            cursor_factory=RealDictCursor
        ) as cur:
            cur.execute(
                """
                SELECT
                    job_id,
                    job_type,
                    job_status,
                    request_payload,
                    result_payload,
                    error_message,
                    created_at,
                    started_at,
                    completed_at,
                    worker_id,
                    attempt_count,
                    claimed_at
                FROM jobs.job_queue
                ORDER BY job_id DESC
                LIMIT %s;
                """,
                (limit,),
            )

            rows = cur.fetchall()

    return [
        _serialize_job(dict(row))
        for row in rows
    ]
