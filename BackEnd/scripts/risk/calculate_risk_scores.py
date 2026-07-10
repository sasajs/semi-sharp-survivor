from app.db import get_connection


SOURCE_SYSTEM = "SEMISHARP_RISK_V2"


def calculate_stars(score):
    if score <= 5:
        return 1
    elif score <= 10:
        return 2
    elif score <= 15:
        return 3
    elif score <= 20:
        return 4
    else:
        return 5


def main():

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                DELETE FROM risk.game_risk_scores
                WHERE source_system = %s;
            """, (SOURCE_SYSTEM,))


            cur.execute("""
                SELECT
                    season,
                    week,
                    game_id,
                    team_id,
                    SUM(risk_points) AS risk_score,
                    COUNT(*) AS factor_count,
                    STRING_AGG(risk_type, ', ') AS risk_summary
                FROM risk.game_risk_factors
                WHERE source_system = %s
                GROUP BY
                    season,
                    week,
                    game_id,
                    team_id;
            """, (SOURCE_SYSTEM,))


            rows = cur.fetchall()

            inserted = 0

            for row in rows:

                season = row[0]
                week = row[1]
                game_id = row[2]
                team_id = row[3]
                score = float(row[4])
                factor_count = row[5]
                summary = row[6]

                stars = calculate_stars(score)

                if stars <= 2:
                    level = "LOW"
                elif stars == 3:
                    level = "MODERATE"
                elif stars == 4:
                    level = "HIGH"
                else:
                    level = "EXTREME"


                cur.execute("""
                    INSERT INTO risk.game_risk_scores (
                        season,
                        week,
                        game_id,
                        team_id,
                        risk_score,
                        risk_stars,
                        risk_level,
                        factor_count,
                        risk_summary,
                        source_system
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);
                """, (
                    season,
                    week,
                    game_id,
                    team_id,
                    score,
                    stars,
                    level,
                    factor_count,
                    summary,
                    SOURCE_SYSTEM
                ))

                inserted += 1

            conn.commit()

    print(f"Calculated risk scores: {inserted}")


if __name__ == "__main__":
    main()
