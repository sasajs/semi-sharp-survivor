from app.db import get_connection


def determine_favorite(row):
    spread = row["spread_line"]

    if spread is None:
        return None

    if spread < 0:
        return {
            "favorite_team_id": row["away_team_id"],
            "underdog_team_id": row["home_team_id"],
            "favorite_score": row["away_score"],
            "underdog_score": row["home_score"],
        }

    return {
        "favorite_team_id": row["home_team_id"],
        "underdog_team_id": row["away_team_id"],
        "favorite_score": row["home_score"],
        "underdog_score": row["away_score"],
    }


def main():

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                DELETE FROM analytics.historical_upset_games;
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
                    spread_line
                FROM schedule.games
                WHERE season BETWEEN 2015 AND 2025
                  AND result IS NOT NULL
                  AND spread_line IS NOT NULL;
            """)

            games = cur.fetchall()

            imported = 0

            for game in games:

                row = {
                    "game_id": game[0],
                    "season": game[1],
                    "week": game[2],
                    "away_team_id": game[3],
                    "home_team_id": game[4],
                    "away_score": game[5],
                    "home_score": game[6],
                    "spread_line": game[7],
                }

                favorite = determine_favorite(row)

                favorite_won = (
                    favorite["favorite_score"] >
                    favorite["underdog_score"]
                )

                cur.execute("""
                    INSERT INTO analytics.historical_upset_games (
                        season,
                        week,
                        game_id,
                        favorite_team_id,
                        underdog_team_id,
                        spread_line,
                        favorite_score,
                        underdog_score,
                        favorite_won,
                        upset
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);
                """, (
                    row["season"],
                    row["week"],
                    row["game_id"],
                    favorite["favorite_team_id"],
                    favorite["underdog_team_id"],
                    row["spread_line"],
                    favorite["favorite_score"],
                    favorite["underdog_score"],
                    favorite_won,
                    not favorite_won,
                ))

                imported += 1

            conn.commit()

    print(f"Imported historical upset games: {imported}")


if __name__ == "__main__":
    main()