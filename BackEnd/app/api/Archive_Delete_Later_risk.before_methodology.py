from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/risk", tags=["Risk"])


@router.get("/{season}/{week}")
def get_risks(season: int, week: int):

    sql = """
        SELECT
            r.game_id,
            t.team_abbr,
            r.total_risk_points,
            r.risk_factor_count,
            r.risk_types
        FROM risk.game_risk_summary r
        JOIN reference.teams t
          ON t.team_id = r.team_id
        WHERE r.season = %s
          AND r.week = %s
        ORDER BY r.total_risk_points DESC;
    """

    risks = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))

            for row in cur.fetchall():
                risks.append({
                    "game_id": row[0],
                    "team": row[1],
                    "risk_points": float(row[2]),
                    "risk_factor_count": row[3],
                    "risk_types": row[4]
                })

    return {
        "season": season,
        "week": week,
        "count": len(risks),
        "risks": risks
    }
