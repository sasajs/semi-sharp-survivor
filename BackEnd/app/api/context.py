from fastapi import APIRouter
from pydantic import BaseModel

from app.db import get_connection


router = APIRouter(prefix="/context", tags=["Context"])


class ContextUpdate(BaseModel):
    season: int
    current_week: int
    rating_week: int
    projection_model: str
    hfa_source: str


@router.get("/current")
def current_context():

    sql = """
        SELECT
            season,
            current_week,
            rating_week,
            projection_model,
            hfa_source
        FROM system.application_context
        WHERE is_active = TRUE
        LIMIT 1;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone()

            if row is None:
                return {
                    "error": "No active application context found"
                }

            return {
                "season": row[0],
                "current_week": row[1],
                "rating_week": row[2],
                "projection_model": row[3],
                "hfa_source": row[4],
                "api_version": "1.0"
            }


@router.put("/current")
def update_context(context: ContextUpdate):

    sql = """
        UPDATE system.application_context
        SET
            season = %s,
            current_week = %s,
            rating_week = %s,
            projection_model = %s,
            hfa_source = %s,
            updated_at = now()
        WHERE is_active = TRUE
        RETURNING
            season,
            current_week,
            rating_week,
            projection_model,
            hfa_source;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    context.season,
                    context.current_week,
                    context.rating_week,
                    context.projection_model,
                    context.hfa_source
                )
            )

            row = cur.fetchone()

        conn.commit()

    return {
        "season": row[0],
        "current_week": row[1],
        "rating_week": row[2],
        "projection_model": row[3],
        "hfa_source": row[4],
        "updated": True
    }
