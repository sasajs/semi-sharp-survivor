from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/strategies", tags=["Strategy Registry"])


@router.get("")
def get_strategies():

    sql = """
        SELECT
            strategy_code,
            display_name,
            description,
            endpoint,
            runtime_class,
            requires_background_job,
            parameters
        FROM strategy.registry
        WHERE is_active = TRUE
        ORDER BY strategy_id;
    """

    strategies = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)

            for row in cur.fetchall():
                strategies.append({
                    "code": row[0],
                    "name": row[1],
                    "description": row[2],
                    "endpoint": row[3],
                    "runtime": row[4],
                    "requires_background_job": row[5],
                    "parameters": row[6]
                })

    return {
        "count": len(strategies),
        "strategies": strategies
    }
