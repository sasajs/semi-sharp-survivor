#!/usr/bin/env python3
"""
Calculate baseline and risk-adjusted win probabilities for both teams.

Purpose
-------
This script converts the SemiSharp projected spread into a baseline win
probability for the projected favorite, derives the opposing team's
probability as the complement, and applies the active Risk Engine V3
discount.

Key Rules
---------
1. The projected favorite must receive the higher baseline probability.
2. The opposing team receives 1 - favorite_probability.
3. Risk is joined specifically to the projected favorite.
4. Results are written idempotently to
   analytics.game_win_probabilities.
5. The canonical model identifier is SEMISHARP_WP_V3.
"""

import argparse
import math
from decimal import Decimal

from app.db import get_connection


CALIBRATION_INTERCEPT = Decimal("-0.136299")
CALIBRATION_COEFFICIENT = Decimal("0.165789")
SOURCE_SYSTEM = "SEMISHARP_WP_V3"
RISK_SOURCE_SYSTEM = "SEMISHARP_RISK_V3"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Calculate win probabilities for both teams."
    )
    parser.add_argument(
        "--season",
        type=int,
        required=True,
    )
    return parser.parse_args()


def calculate_favorite_probability(spread):
    """
    Convert projected spread strength into favorite win probability.

    The projected spread is stored as a negative number for the favorite.
    We use its absolute strength and a negative logistic exponent so that
    larger favorites receive higher probabilities.

    Example:
        spread = -13.5
        favorite probability approaches 1.0

        spread = -1.0
        favorite probability remains only modestly above 0.5
    """
    spread_strength = abs(Decimal(spread))

    logit = (
        CALIBRATION_INTERCEPT
        + CALIBRATION_COEFFICIENT * spread_strength
    )

    return Decimal("1") / (
        Decimal("1")
        + Decimal(str(math.exp(-float(logit))))
    )


def calculate_risk_discount(risk_score):
    """
    Scale Risk Engine V3 score into a probability discount.

    A risk score of 30 corresponds to a 10% discount.
    Values are capped between 0% and 10%.
    """
    score = Decimal(risk_score or 0)

    discount = (score / Decimal("30")) * Decimal("0.10")

    return min(
        max(discount, Decimal("0")),
        Decimal("0.10"),
    )


def main():
    args = parse_args()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    p.game_id,
                    p.season,
                    p.week,
                    p.projected_favorite_team_id,
                    p.home_team_id,
                    p.away_team_id,
                    p.projected_spread,
                    COALESCE(r.risk_score, 0) AS risk_score
                FROM projections.game_spreads p
                LEFT JOIN risk.game_risk_scores r
                  ON r.game_id = p.game_id
                 AND r.team_id = p.projected_favorite_team_id
                 AND r.source_system = %s
                WHERE p.season = %s
                  AND p.source_system = 'SEMISHARP_PROJECTION_V2'
                  AND p.hfa_source_system = (
                      SELECT hfa_source
                      FROM system.application_context
                      WHERE is_active = true
                        AND season = p.season
                      LIMIT 1
                  )
                ORDER BY p.week, p.game_id;
                """,
                (
                    RISK_SOURCE_SYSTEM,
                    args.season,
                ),
            )

            rows = cur.fetchall()
            processed = 0

            for (
                game_id,
                season,
                week,
                favorite_team_id,
                home_team_id,
                away_team_id,
                projected_spread,
                risk_score,
            ) in rows:
                favorite_wp = calculate_favorite_probability(
                    projected_spread
                )
                underdog_wp = Decimal("1") - favorite_wp

                risk_discount = calculate_risk_discount(risk_score)
                adjustment_factor = Decimal("1") - risk_discount

                underdog_team_id = (
                    away_team_id
                    if favorite_team_id == home_team_id
                    else home_team_id
                )

                team_probabilities = (
                    (
                        favorite_team_id,
                        favorite_wp,
                        favorite_wp * adjustment_factor,
                    ),
                    (
                        underdog_team_id,
                        underdog_wp,
                        underdog_wp * adjustment_factor,
                    ),
                )

                for (
                    team_id,
                    baseline_wp,
                    risk_adjusted_wp,
                ) in team_probabilities:
                    cur.execute(
                        """
                        INSERT INTO analytics.game_win_probabilities (
                            season,
                            week,
                            game_id,
                            team_id,
                            baseline_wp,
                            risk_adjusted_wp,
                            risk_discount_factor,
                            source_system
                        )
                        VALUES (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        ON CONFLICT (
                            season,
                            week,
                            game_id,
                            team_id,
                            source_system
                        )
                        DO UPDATE SET
                            baseline_wp = EXCLUDED.baseline_wp,
                            risk_adjusted_wp =
                                EXCLUDED.risk_adjusted_wp,
                            risk_discount_factor =
                                EXCLUDED.risk_discount_factor;
                        """,
                        (
                            season,
                            week,
                            game_id,
                            team_id,
                            baseline_wp,
                            risk_adjusted_wp,
                            risk_discount,
                            SOURCE_SYSTEM,
                        ),
                    )

                    processed += 1

        conn.commit()

    print(
        "Win Probability calculation complete. "
        f"Processed {processed} team records."
    )


if __name__ == "__main__":
    main()
