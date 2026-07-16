from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/teams", tags=["Teams"])


@router.get("")
def get_teams():
    sql = """
        SELECT
            team_id,
            team_abbr,
            team_name,
            team_nick,
            conference,
            division
        FROM reference.teams
        WHERE is_active = TRUE
        ORDER BY team_abbr;
    """

    teams = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)

            for row in cur.fetchall():
                teams.append({
                    "team_id": row[0],
                    "team_abbr": row[1],
                    "team_name": row[2],
                    "team_nick": row[3],
                    "conference": row[4],
                    "division": row[5]
                })

    return {
        "count": len(teams),
        "teams": teams
    }
