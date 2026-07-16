from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/injuries", tags=["Injuries"])


@router.get("/sic/{season}/{week}")
def get_sic_scores(season: int, week: int):

    sql = """
        SELECT
            t.team_abbr,
            t.team_name,
            s.sic_score,
            s.source_system,
            s.imported_at
        FROM injuries.team_sic_scores s
        JOIN reference.teams t
          ON t.team_id = s.team_id
        WHERE s.season = %s
          AND s.week = %s
        ORDER BY s.sic_score ASC;
    """

    teams = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))

            for row in cur.fetchall():
                teams.append({
                    "team": row[0],
                    "team_name": row[1],
                    "sic_score": float(row[2]),
                    "source": row[3],
                    "imported_at": str(row[4])
                })

    return {
        "season": season,
        "week": week,
        "count": len(teams),
        "sic_scores": teams
    }
