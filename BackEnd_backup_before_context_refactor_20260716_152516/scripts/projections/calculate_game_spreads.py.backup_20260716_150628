import argparse
from decimal import Decimal
from app.db import get_connection


SIC_WEIGHT = Decimal("0.05")


def parse_args():
    parser = argparse.ArgumentParser(description="Calculate projected game spreads v2.")
    parser.add_argument("--season", type=int, required=True)
    return parser.parse_args()


def main():
    args = parse_args()
    inserted = 0

    sql = """
        SELECT
            pi.game_id,
            pi.season,
            pi.week,
            pi.home_team_id,
            pi.away_team_id,
            pi.home_team AS home_team_abbr,
            pi.away_team AS away_team_abbr,
            pi.home_power AS home_power_rating,
            pi.away_power AS away_power_rating,
            CASE
                WHEN g.location = 'Neutral' THEN 0
                ELSE pi.home_field_points
            END AS home_field_points,
            pi.sic_difference
        FROM projections.projection_inputs pi
        JOIN schedule.games g ON g.game_id = pi.game_id
        WHERE pi.season = %s
        ORDER BY pi.week, g.gameday, g.gametime;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (args.season,))
            columns = [desc[0] for desc in cur.description]

            for row in cur.fetchall():
                game = dict(zip(columns, row))

                home_rating = Decimal(game["home_power_rating"])
                away_rating = Decimal(game["away_power_rating"])
                hfa = Decimal(game["home_field_points"])
                sic_adjustment = Decimal(game["sic_difference"]) * SIC_WEIGHT

                power_diff = home_rating - away_rating
                projected_home_margin = power_diff + hfa + sic_adjustment

                if projected_home_margin >= 0:
                    favorite_team_id = game["home_team_id"]
                    favorite_abbr = game["home_team_abbr"]
                    projected_spread = -projected_home_margin
                else:
                    favorite_team_id = game["away_team_id"]
                    favorite_abbr = game["away_team_abbr"]
                    projected_spread = -abs(projected_home_margin)

                cur.execute("""
                    INSERT INTO projections.game_spreads (
                        season,
                        week,
                        game_id,
                        rating_week,
                        hfa_source_system,
                        home_team_id,
                        away_team_id,
                        home_power_rating,
                        away_power_rating,
                        power_rating_diff,
                        home_field_points,
                        projected_home_margin,
                        projected_favorite_team_id,
                        projected_favorite_abbr,
                        projected_spread,
                        source_system
                    )
                    VALUES (%s, %s, %s, 1, 'SEMISHARP_2026', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'SEMISHARP_PROJECTION_V2')
                    ON CONFLICT (season, week, game_id, rating_week, hfa_source_system)
                    DO UPDATE SET
                        home_power_rating = EXCLUDED.home_power_rating,
                        away_power_rating = EXCLUDED.away_power_rating,
                        power_rating_diff = EXCLUDED.power_rating_diff,
                        home_field_points = EXCLUDED.home_field_points,
                        projected_home_margin = EXCLUDED.projected_home_margin,
                        projected_favorite_team_id = EXCLUDED.projected_favorite_team_id,
                        projected_favorite_abbr = EXCLUDED.projected_favorite_abbr,
                        projected_spread = EXCLUDED.projected_spread,
                        source_system = EXCLUDED.source_system,
                        created_at = now();
                """, (
                    game["season"],
                    game["week"],
                    game["game_id"],
                    game["home_team_id"],
                    game["away_team_id"],
                    home_rating,
                    away_rating,
                    power_diff,
                    hfa,
                    projected_home_margin,
                    favorite_team_id,
                    favorite_abbr,
                    projected_spread,
                ))

                inserted += 1

        conn.commit()

    print(f"Calculated projected spreads v2: {inserted}")


if __name__ == "__main__":
    main()
