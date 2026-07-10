from app.db import get_connection


def calculate_risk(game):

    points = 0
    factors = []

    spread = game["spread_line"]

    # Market confidence risk
    if abs(spread) <= 3:
        points += 15
        factors.append("SMALL_FAVORITE")

    elif abs(spread) <= 7:
        points += 8
        factors.append("MODERATE_FAVORITE")


    # Away favorite
    if spread < 0 and game["away_team_id"] == game["favorite_team_id"]:
        points += 2
        factors.append("AWAY_FAVORITE")


    # Division
    if game["div_game"]:
        factors.append("DIVISION_GAME")


    # Rest
    if game["favorite_team_id"] == game["home_team_id"]:
        rest_diff = game["home_rest"] - game["away_rest"]
    else:
        rest_diff = game["away_rest"] - game["home_rest"]

    if rest_diff <= -2:
        points += 1
        factors.append("REST_DISADVANTAGE")


    # Weather placeholder removed in V3
    # Venue alone not predictive


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
                    div_game,
                    away_rest,
                    home_rest,
                    roof
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
                    "div_game": r[8],
                    "away_rest": r[9],
                    "home_rest": r[10],
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
                """,
                (
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

    print(f"Historical risk analysis rows: {inserted}")


if __name__ == "__main__":
    main()