from psycopg2.extras import RealDictCursor, Json

from app.db import get_connection


def claim_job():

    conn = get_connection()

    try:
        conn.autocommit = False

        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            cur.execute(
                """
                SELECT
                    job_id,
                    job_type,
                    request_payload
                FROM jobs.job_queue
                WHERE job_status = 'queued'
                ORDER BY created_at
                LIMIT 1
                FOR UPDATE SKIP LOCKED;
                """
            )

            job = cur.fetchone()

            if job is None:
                conn.rollback()
                return None

            cur.execute(
                """
                UPDATE jobs.job_queue
                SET
                    job_status = 'running',
                    started_at = NOW(),
                    claimed_at = NOW(),
                    attempt_count = attempt_count + 1,
                    worker_id = 't30-worker'
                WHERE job_id = %s;
                """,
                (job["job_id"],)
            )

            conn.commit()

            return dict(job)

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


def complete_job(job_id, result):

    with get_connection() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                UPDATE jobs.job_queue
                SET
                    job_status = 'completed',
                    result_payload = %s,
                    completed_at = NOW()
                WHERE job_id = %s;
                """,
                (
                    Json(result),
                    job_id
                )
            )


def fail_job(job_id, error):

    with get_connection() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                UPDATE jobs.job_queue
                SET
                    job_status = 'failed',
                    error_message = %s,
                    completed_at = NOW()
                WHERE job_id = %s;
                """,
                (
                    str(error),
                    job_id
                )
            )
