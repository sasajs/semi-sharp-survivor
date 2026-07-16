from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/projections", tags=["Projections"])


@router.get("/{season}/{week}")
def get_projections(season: int, week: int):

    sql = """
        SELECT
            g.game_id,
            g.week,
            at.team_abbr AS away_team,
            ht.team_abbr AS home_team,
            p.projected_favorite_abbr,
            p.projected_spread,
            p.source_system
        FROM projections.game_spreads p
        JOIN schedule.games g
          ON g.game_id = p.game_id
        JOIN reference.teams at
          ON at.team_id = p.away_team_id
        JOIN reference.teams ht
          ON ht.team_id = p.home_team_id
        WHERE p.season = %s
          AND g.week = %s
          AND p.source_system = 'SEMISHARP_PROJECTION_V2'
        ORDER BY g.gameday, g.gametime;
    """

    projections = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))

            for row in cur.fetchall():
                projections.append({
                    "game_id": row[0],
                    "week": row[1],
                    "away_team": row[2],
                    "home_team": row[3],
                    "favorite": row[4],
                    "projected_spread": float(row[5]),
                    "model": row[6]
                })

    return {
        "season": season,
        "week": week,
        "count": len(projections),
        "model": "SEMISHARP_PROJECTION_V2",
        "games": projections
    }
