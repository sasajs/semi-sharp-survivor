from app.db import get_connection


def preview_features(season, week):

    query = """
    SELECT
        g.game_id,
        g.season,
        g.week,

        g.home_team_id,
        g.away_team_id,

        hp.point_spread_rating AS home_power_rating,
        ap.point_spread_rating AS away_power_rating,

        g.home_rest,
        g.away_rest

    FROM schedule.games g

    LEFT JOIN ratings.pff_power_ratings hp
        ON hp.team_id = g.home_team_id
        AND hp.season = g.season
        AND hp.week = g.week

    LEFT JOIN ratings.pff_power_ratings ap
        ON ap.team_id = g.away_team_id
        AND ap.season = g.season
        AND ap.week = g.week

    WHERE g.season = %s
      AND g.week = %s
    ORDER BY g.game_id;
    """

    with get_connection() as conn:

        with conn.cursor() as cur:

            cur.execute(
                query,
                (season, week)
            )

            return cur.fetchall()
