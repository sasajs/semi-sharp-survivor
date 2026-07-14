from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import get_connection


router = APIRouter(prefix="/context", tags=["Context"])


class ContextUpdate(BaseModel):
    season: int = Field(ge=2000, le=2100)
    current_week: int = Field(ge=1, le=22)
    rating_week: int = Field(ge=1, le=22)
    projection_model: str
    hfa_source: str
    risk_model: str
    probability_model: str


@router.get("/current")
def current_context():
    sql = """
        SELECT
            season,
            current_week,
            rating_week,
            projection_model,
            hfa_source,
            risk_model,
            probability_model
        FROM system.application_context
        WHERE is_active = TRUE
        LIMIT 1;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="No active application context found",
        )

    return {
        "season": row[0],
        "current_week": row[1],
        "rating_week": row[2],
        "projection_model": row[3],
        "hfa_source": row[4],
        "risk_model": row[5],
        "probability_model": row[6],
        "api_version": "1.0",
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
            risk_model = %s,
            probability_model = %s,
            updated_at = now()
        WHERE is_active = TRUE
        RETURNING
            season,
            current_week,
            rating_week,
            projection_model,
            hfa_source,
            risk_model,
            probability_model;
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
                    context.hfa_source,
                    context.risk_model,
                    context.probability_model,
                ),
            )
            row = cur.fetchone()

        conn.commit()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="No active application context found",
        )

    return {
        "season": row[0],
        "current_week": row[1],
        "rating_week": row[2],
        "projection_model": row[3],
        "hfa_source": row[4],
        "risk_model": row[5],
        "probability_model": row[6],
        "updated": True,
    }
