from app.db import get_connection


def calculate_risk(game):

    points = 0
    factors = []

    spread = abs(game["spread_line"])

    # Historical market risk
    if spread <= 3:
        points += 15
        factors.append("SMALL_FAVORITE")

    elif spread <= 7:
        points += 8
        factors.append("MODERATE_FAVORITE")

    elif spread <= 14:
        points += 3
        factors.append("LARGE_FAVORITE")


    # Road favorite modifier
    if game["favorite_team_id"] == game["away_team_id"]:
        points += 2
        factors.append("AWAY_FAVORITE")


    # Small rest modifier
    if game["favorite_team_id"] == game["home_team_id"]:
        rest_diff = game["home_rest"] - game["away_rest"]
    else:
        rest_diff = game["away_rest"] - game["home_rest"]

    if rest_diff <= -2:
        points += 1
        factors.append("REST_DISADVANTAGE")


    return points, ", ".join(factors)


def main():

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                DELETE FROM analytics.historical_risk_analysis;
            """)

            cur.execute("""
                SELECT
                    game_id,
                    season,
                    week,
                    away_team_id,
                    home_team_id,
                    away_score,
                    home_score,
                    spread_line,
                    away_rest,
                    home_rest
                FROM schedule.games
                WHERE season BETWEEN 2015 AND 2025
                AND result IS NOT NULL
                AND spread_line IS NOT NULL;
            """)

            rows = cur.fetchall()
            inserted = 0

            for r in rows:

                game = {
                    "game_id": r[0],
                    "season": r[1],
                    "week": r[2],
                    "away_team_id": r[3],
                    "home_team_id": r[4],
                    "away_score": r[5],
                    "home_score": r[6],
                    "spread_line": r[7],
                    "away_rest": r[8],
                    "home_rest": r[9],
                }


                if game["spread_line"] < 0:
                    game["favorite_team_id"] = game["away_team_id"]
                    favorite_score = game["away_score"]
                    underdog_score = game["home_score"]

                else:
                    game["favorite_team_id"] = game["home_team_id"]
                    favorite_score = game["home_score"]
                    underdog_score = game["away_score"]


                risk_score, factors = calculate_risk(game)

                upset = favorite_score < underdog_score


                cur.execute("""
                    INSERT INTO analytics.historical_risk_analysis (
                        season,
                        week,
                        game_id,
                        favorite_team_id,
                        underdog_team_id,
                        spread_line,
                        risk_score,
                        risk_factors,
                        upset
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s);
                """, (
                    game["season"],
                    game["week"],
                    game["game_id"],
                    game["favorite_team_id"],
                    game["home_team_id"]
                    if game["favorite_team_id"] == game["away_team_id"]
                    else game["away_team_id"],
                    game["spread_line"],
                    risk_score,
                    factors,
                    upset
                ))

                inserted += 1

            conn.commit()

    print(f"Historical V3 risk analysis rows: {inserted}")


if __name__ == "__main__":
    main()
