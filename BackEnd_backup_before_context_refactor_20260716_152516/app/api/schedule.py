from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/schedule", tags=["Schedule"])


@router.get("/{season}/{week}")
def get_schedule(season: int, week: int):

    sql = """
        SELECT
            g.game_id,
            g.week,
            g.gameday,
            g.gametime,
            g.away_team_abbr,
            g.home_team_abbr,
            g.location,
            g.stadium,
            g.is_thanksgiving,
            g.is_christmas,
            g.away_rest,
            g.home_rest
        FROM schedule.games g
        WHERE g.season = %s
          AND g.week = %s
        ORDER BY g.gameday, g.gametime;
    """

    games = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))

            for row in cur.fetchall():
                games.append({
                    "game_id": row[0],
                    "week": row[1],
                    "date": str(row[2]),
                    "time": row[3],
                    "away_team": row[4],
                    "home_team": row[5],
                    "location": row[6],
                    "stadium": row[7],
                    "thanksgiving": row[8],
                    "christmas": row[9],
                    "away_rest": row[10],
                    "home_rest": row[11]
                })

    return {
        "season": season,
        "week": week,
        "count": len(games),
        "games": games
    }
