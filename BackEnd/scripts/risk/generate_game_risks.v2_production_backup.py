import argparse
from app.db import get_connection


SOURCE_SYSTEM = "SEMISHARP_RISK_V2"


def parse_args():
    parser = argparse.ArgumentParser(description="Generate automatic game risk factors.")
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()


def get_risk_weight(cur, risk_type):
    cur.execute("""
        SELECT default_points, severity
        FROM risk.risk_factor_weights
        WHERE risk_type = %s
          AND active = TRUE;
    """, (risk_type,))

    result = cur.fetchone()

    if result is None:
        raise Exception(f"No active risk weight found for {risk_type}")

    return result[1], result[0]


def insert_risk(cur, game, team_id, risk_type, severity, risk_points, description):
    cur.execute("""
        INSERT INTO risk.game_risk_factors (
            season,
            week,
            game_id,
            team_id,
            risk_type,
            severity,
            risk_points,
            description,
            source_system
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (game_id, team_id, risk_type, source_system)
        DO UPDATE SET
            severity = EXCLUDED.severity,
            risk_points = EXCLUDED.risk_points,
            description = EXCLUDED.description,
            created_at = now();
    """, (
        game["season"],
        game["week"],
        game["game_id"],
        team_id,
        risk_type,
        severity,
        risk_points,
        description,
        SOURCE_SYSTEM
    ))


def add_risk(cur, game, team_id, risk_type, description):
    severity, points = get_risk_weight(cur, risk_type)

    insert_risk(
        cur,
        game,
        team_id,
        risk_type,
        severity,
        points,
        description
    )


def main():
    args = parse_args()
    inserted = 0

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                DELETE FROM risk.game_risk_factors
                WHERE season = %s
                  AND week = %s
                  AND source_system = %s;
            """, (
                args.season,
                args.week,
                SOURCE_SYSTEM
            ))

            cur.execute("""
                SELECT
                    g.game_id,
                    g.season,
                    g.week,
                    g.location,
                    g.roof,
                    g.surface,
                    g.div_game,
                    g.away_rest,
                    g.home_rest,
                    g.away_team_id,
                    g.home_team_id,

                    at.team_abbr AS away_team,
                    ht.team_abbr AS home_team,

                    p.projected_favorite_team_id,
                    p.projected_favorite_abbr,

                    pff_home.point_spread_rating AS home_pff_rating,
                    pff_away.point_spread_rating AS away_pff_rating,

                    pff_home.qb_rating AS home_qb_rating,
                    pff_away.qb_rating AS away_qb_rating,

                    sic_home.sic_score AS home_sic_score,
                    sic_away.sic_score AS away_sic_score

                FROM schedule.games g

                JOIN reference.teams at
                    ON at.team_id = g.away_team_id

                JOIN reference.teams ht
                    ON ht.team_id = g.home_team_id

                JOIN projections.game_spreads p
                    ON p.game_id = g.game_id
                   AND p.rating_week = %s
                   AND p.hfa_source_system = %s

                LEFT JOIN ratings.pff_power_ratings pff_home
                    ON pff_home.team_id = g.home_team_id
                   AND pff_home.season = g.season
                   AND pff_home.week = %s

                LEFT JOIN ratings.pff_power_ratings pff_away
                    ON pff_away.team_id = g.away_team_id
                   AND pff_away.season = g.season
                   AND pff_away.week = %s

                LEFT JOIN injuries.team_sic_scores sic_home
                    ON sic_home.team_id = g.home_team_id
                   AND sic_home.season = g.season
                   AND sic_home.week = g.week

                LEFT JOIN injuries.team_sic_scores sic_away
                    ON sic_away.team_id = g.away_team_id
                   AND sic_away.season = g.season
                   AND sic_away.week = g.week

                WHERE g.season = %s
                  AND g.week = %s

                ORDER BY g.gameday, g.gametime;
            """, (
                args.rating_week,
                args.hfa_source,
                args.rating_week,
                args.rating_week,
                args.season,
                args.week
            ))

            cols = [d[0] for d in cur.description]
            games = [dict(zip(cols, row)) for row in cur.fetchall()]
            for game in games:

                favorite_id = game["projected_favorite_team_id"]

                if favorite_id is None:
                    continue

                opponent_id = (
                    game["away_team_id"]
                    if favorite_id == game["home_team_id"]
                    else game["home_team_id"]
                )

                # ---------------------------------
                # Existing Risk Factors
                # ---------------------------------

                if favorite_id == game["away_team_id"]:
                    add_risk(
                        cur,
                        game,
                        favorite_id,
                        "AWAY_FAVORITE",
                        f"{game['projected_favorite_abbr']} is favored on the road."
                    )
                    inserted += 1


                if game["location"] == "Neutral":
                    add_risk(
                        cur,
                        game,
                        favorite_id,
                        "NEUTRAL_SITE",
                        "Game is played at a neutral/international site."
                    )
                    inserted += 1


                favorite_rest = (
                    game["home_rest"]
                    if favorite_id == game["home_team_id"]
                    else game["away_rest"]
                )

                opponent_rest = (
                    game["away_rest"]
                    if favorite_id == game["home_team_id"]
                    else game["home_rest"]
                )


                if favorite_rest is not None and opponent_rest is not None:

                    rest_diff = favorite_rest - opponent_rest

                    if rest_diff <= -2:
                        add_risk(
                            cur,
                            game,
                            favorite_id,
                            "REST_DISADVANTAGE",
                            f"Favorite has rest disadvantage of {abs(rest_diff)} days."
                        )
                        inserted += 1


                    if opponent_rest >= 13:
                        add_risk(
                            cur,
                            game,
                            favorite_id,
                            "OPPONENT_OFF_BYE",
                            f"Opponent has extended rest/bye advantage ({opponent_rest} days)."
                        )
                        inserted += 1


                if game["roof"] == "outdoors":
                    add_risk(
                        cur,
                        game,
                        favorite_id,
                        "OUTDOOR_WEATHER_PLACEHOLDER",
                        "Outdoor game; weather risk placeholder until weather feed is added."
                    )
                    inserted += 1


                # ---------------------------------
                # Division Game Risk
                # ---------------------------------

                if game["div_game"]:
                    add_risk(
                        cur,
                        game,
                        favorite_id,
                        "DIVISION_GAME",
                        "Division matchup increases uncertainty."
                    )
                    inserted += 1


                # ---------------------------------
                # PFF Strength Gap Risk
                # ---------------------------------

                favorite_pff = (
                    game["home_pff_rating"]
                    if favorite_id == game["home_team_id"]
                    else game["away_pff_rating"]
                )

                opponent_pff = (
                    game["away_pff_rating"]
                    if favorite_id == game["home_team_id"]
                    else game["home_pff_rating"]
                )


                if favorite_pff is not None and opponent_pff is not None:

                    pff_gap = favorite_pff - opponent_pff

                    if pff_gap < 0:
                        add_risk(
                            cur,
                            game,
                            favorite_id,
                            "PFF_STRENGTH_GAP",
                            f"Favorite has limited PFF strength advantage ({pff_gap:.1f})."
                        )
                        inserted += 1


                # ---------------------------------
                # QB Quality Risk
                # ---------------------------------

                favorite_qb = (
                    game["home_qb_rating"]
                    if favorite_id == game["home_team_id"]
                    else game["away_qb_rating"]
                )

                opponent_qb = (
                    game["away_qb_rating"]
                    if favorite_id == game["home_team_id"]
                    else game["home_qb_rating"]
                )


                if favorite_qb is not None and opponent_qb is not None:

                    qb_gap = favorite_qb - opponent_qb

                    if qb_gap < 0:
                        add_risk(
                            cur,
                            game,
                            favorite_id,
                            "QB_QUALITY_GAP",
                            f"Favorite QB advantage is limited ({qb_gap:.1f})."
                        )
                        inserted += 1


                # ---------------------------------
                # SIC Injury Risk
                # ---------------------------------

                favorite_sic = (
                    game["home_sic_score"]
                    if favorite_id == game["home_team_id"]
                    else game["away_sic_score"]
                )


                if favorite_sic is not None and favorite_sic >= 60:

                    add_risk(
                        cur,
                        game,
                        favorite_id,
                        "SIC_INJURY_RISK",
                        f"Favorite has elevated SIC injury score ({favorite_sic})."
                    )
                    inserted += 1


        conn.commit()


    print(f"Generated V2 risk factors: {inserted}")


if __name__ == "__main__":
    main()
