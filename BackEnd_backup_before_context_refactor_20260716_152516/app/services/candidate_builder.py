from __future__ import annotations

from dataclasses import asdict, dataclass
from decimal import Decimal
from typing import Any

from app.db import get_connection
from app.services.strategy_context_service import StrategyContext


class CandidateBuilderError(ValueError):
    """Raised when the canonical candidate matrix cannot be built."""


@dataclass(frozen=True, slots=True)
class StrategyCandidate:
    """
    One legal or potentially legal survivor selection.

    A candidate represents one team in one game assigned to one contest leg.
    It contains backend-generated analytical values but no strategy-specific
    ranking or recommendation logic.
    """

    # Contest leg
    contest_leg_id: int
    leg_number: int
    leg_code: str
    leg_name: str
    nfl_week: int | None
    is_special_leg: bool
    special_leg_type: str | None

    # Game
    game_id: str
    home_team_id: int
    home_team_abbr: str
    away_team_id: int
    away_team_abbr: str
    gameday: Any
    gametime: str | None

    # Candidate team
    team_id: int
    team_abbr: str
    team_name: str
    opponent_team_id: int
    opponent_team_abbr: str
    team_location: str

    # Canonical probabilities
    baseline_wp: Decimal
    risk_adjusted_wp: Decimal
    risk_discount_factor: Decimal | None
    probability_model: str

    # Projection support
    projected_favorite_team_id: int | None
    projected_favorite_abbr: str | None
    projected_spread: Decimal | None
    candidate_projected_spread: Decimal | None
    projection_model: str | None

    # Risk support
    risk_score: Decimal | None
    risk_stars: int | None
    risk_level: str | None
    risk_summary: str | None
    risk_model: str | None

    # Market support
    market_spread: Decimal | None
    market_price: Decimal | None
    sportsbook_count: int | None
    edge_points: Decimal | None

    # Survivor eligibility
    already_used: bool
    eligible: bool

    def to_dict(self) -> dict[str, Any]:
        """
        Convert the candidate to a JSON-friendly dictionary.

        Decimal values are converted to floats so FastAPI and strategy scripts
        return consistent JSON without performing frontend conversions.
        """
        payload = asdict(self)

        for key, value in payload.items():
            if isinstance(value, Decimal):
                payload[key] = float(value)

        return payload


def build_candidate_matrix(
    context: StrategyContext,
    *,
    include_ineligible: bool = True,
) -> list[StrategyCandidate]:
    """
    Build the canonical candidate matrix for all remaining contest legs.

    Rules
    -----
    1. Uses analytics.game_win_probabilities.risk_adjusted_wp as the
       canonical probability source.
    2. Uses the model versions contained in StrategyContext.
    3. Includes all remaining contest legs beginning with the active leg.
    4. Maps CIRCA Thanksgiving and Christmas games to their special legs.
    5. Excludes Thanksgiving and Christmas games from normal CIRCA legs.
    6. Uses StrategyContext.used_team_ids as the authoritative
       used-team set.
    7. Marks previously used teams as ineligible.
    8. Performs no strategy-specific scoring or ranking.
    """

    sql = """
        WITH remaining_legs AS (
            SELECT
                l.contest_leg_id,
                l.leg_number,
                l.leg_code,
                l.leg_name,
                l.nfl_week,
                l.is_special_leg,
                l.special_leg_type
            FROM contest.legs l
            WHERE l.contest_format_id = %s
              AND l.season = %s
              AND l.leg_number >= %s
        ),
        used_teams AS (
            SELECT
                UNNEST(%s::integer[]) AS team_id
        ),
        active_projections AS (
            SELECT
                p.game_id,
                p.projected_favorite_team_id,
                p.projected_favorite_abbr,
                p.projected_spread,
                p.source_system
            FROM projections.game_spreads p
            WHERE p.season = %s
              AND p.rating_week = %s
              AND p.hfa_source_system = %s
              AND p.source_system = %s
        ),
        active_probabilities AS (
            SELECT
                wp.game_id,
                wp.team_id,
                wp.baseline_wp,
                wp.risk_adjusted_wp,
                wp.risk_discount_factor,
                wp.source_system
            FROM analytics.game_win_probabilities wp
            WHERE wp.season = %s
              AND wp.source_system = %s
        ),
        active_risk AS (
            SELECT
                r.game_id,
                r.team_id,
                r.risk_score,
                r.risk_stars,
                r.risk_level,
                r.risk_summary,
                r.source_system
            FROM risk.game_risk_scores r
            WHERE r.season = %s
              AND r.source_system = %s
        )
        SELECT
            l.contest_leg_id,
            l.leg_number,
            l.leg_code,
            l.leg_name,
            l.nfl_week,
            l.is_special_leg,
            l.special_leg_type,

            g.game_id,
            g.home_team_id,
            g.home_team_abbr,
            g.away_team_id,
            g.away_team_abbr,
            g.gameday,
            g.gametime,

            wp.team_id,
            candidate_team.team_abbr,
            candidate_team.team_name,

            CASE
                WHEN wp.team_id = g.home_team_id
                    THEN g.away_team_id
                ELSE g.home_team_id
            END AS opponent_team_id,

            CASE
                WHEN wp.team_id = g.home_team_id
                    THEN g.away_team_abbr
                ELSE g.home_team_abbr
            END AS opponent_team_abbr,

            CASE
                WHEN wp.team_id = g.home_team_id
                    THEN 'HOME'
                ELSE 'AWAY'
            END AS team_location,

            wp.baseline_wp,
            wp.risk_adjusted_wp,
            wp.risk_discount_factor,
            wp.source_system AS probability_model,

            p.projected_favorite_team_id,
            p.projected_favorite_abbr,
            p.projected_spread,

            CASE
                WHEN p.projected_spread IS NULL THEN NULL
                WHEN wp.team_id = p.projected_favorite_team_id
                    THEN p.projected_spread
                ELSE ABS(p.projected_spread)
            END AS candidate_projected_spread,

            p.source_system AS projection_model,

            r.risk_score,
            r.risk_stars,
            r.risk_level,
            r.risk_summary,
            r.source_system AS risk_model,

            consensus.consensus_spread AS market_spread,
            consensus.consensus_price AS market_price,
            consensus.sportsbook_count,
            edge.edge_points,

            CASE
                WHEN used.team_id IS NOT NULL THEN TRUE
                ELSE FALSE
            END AS already_used,

            CASE
                WHEN used.team_id IS NULL
                 AND candidate_team.is_active = TRUE
                    THEN TRUE
                ELSE FALSE
            END AS eligible

        FROM remaining_legs l

        JOIN schedule.games g
          ON g.season = %s
         AND g.game_type = 'REG'
         AND (
                (
                    l.special_leg_type = 'THANKSGIVING'
                    AND g.is_thanksgiving = TRUE
                )
                OR
                (
                    l.special_leg_type = 'CHRISTMAS'
                    AND g.is_christmas = TRUE
                )
                OR
                (
                    l.special_leg_type IS NULL
                    AND g.week = l.nfl_week
                    AND (
                        %s <> 'CIRCA'
                        OR (
                            g.is_thanksgiving = FALSE
                            AND g.is_christmas = FALSE
                        )
                    )
                )
         )

        JOIN active_probabilities wp
          ON wp.game_id = g.game_id

        JOIN reference.teams candidate_team
          ON candidate_team.team_id = wp.team_id

        LEFT JOIN used_teams used
          ON used.team_id = wp.team_id

        LEFT JOIN active_projections p
          ON p.game_id = g.game_id

        LEFT JOIN active_risk r
          ON r.game_id = g.game_id
         AND r.team_id = wp.team_id

        LEFT JOIN market.consensus_spreads consensus
          ON consensus.game_id = g.game_id
         AND consensus.team_id = wp.team_id

        LEFT JOIN market.projection_edges edge
          ON edge.game_id = g.game_id
         AND edge.team_id = wp.team_id

        ORDER BY
            l.leg_number,
            wp.risk_adjusted_wp DESC,
            candidate_team.team_abbr;
    """

    parameters = (
        context.contest_format_id,
        context.season,
        context.current_leg_number,
        list(context.used_team_ids),
        context.season,
        context.rating_week,
        context.hfa_source,
        context.projection_model,
        context.season,
        context.probability_model,
        context.season,
        context.risk_model,
        context.season,
        context.contest_format,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, parameters)
            rows = cursor.fetchall()
            columns = [
                description[0]
                for description in cursor.description
            ]

    if not rows:
        raise CandidateBuilderError(
            "No strategy candidates were found for the active context."
        )

    candidates: list[StrategyCandidate] = []

    for row in rows:
        record = dict(zip(columns, row))

        candidate = StrategyCandidate(
            contest_leg_id=record["contest_leg_id"],
            leg_number=record["leg_number"],
            leg_code=record["leg_code"],
            leg_name=record["leg_name"],
            nfl_week=record["nfl_week"],
            is_special_leg=record["is_special_leg"],
            special_leg_type=record["special_leg_type"],
            game_id=record["game_id"],
            home_team_id=record["home_team_id"],
            home_team_abbr=record["home_team_abbr"],
            away_team_id=record["away_team_id"],
            away_team_abbr=record["away_team_abbr"],
            gameday=record["gameday"],
            gametime=record["gametime"],
            team_id=record["team_id"],
            team_abbr=record["team_abbr"],
            team_name=record["team_name"],
            opponent_team_id=record["opponent_team_id"],
            opponent_team_abbr=record["opponent_team_abbr"],
            team_location=record["team_location"],
            baseline_wp=record["baseline_wp"],
            risk_adjusted_wp=record["risk_adjusted_wp"],
            risk_discount_factor=record[
                "risk_discount_factor"
            ],
            probability_model=record["probability_model"],
            projected_favorite_team_id=record[
                "projected_favorite_team_id"
            ],
            projected_favorite_abbr=record[
                "projected_favorite_abbr"
            ],
            projected_spread=record["projected_spread"],
            candidate_projected_spread=record[
                "candidate_projected_spread"
            ],
            projection_model=record["projection_model"],
            risk_score=record["risk_score"],
            risk_stars=record["risk_stars"],
            risk_level=record["risk_level"],
            risk_summary=record["risk_summary"],
            risk_model=record["risk_model"],
            market_spread=record["market_spread"],
            market_price=record["market_price"],
            sportsbook_count=(
                int(record["sportsbook_count"])
                if record["sportsbook_count"] is not None
                else None
            ),
            edge_points=record["edge_points"],
            already_used=record["already_used"],
            eligible=record["eligible"],
        )

        if include_ineligible or candidate.eligible:
            candidates.append(candidate)

    if not candidates:
        raise CandidateBuilderError(
            "Candidates were found, but none are eligible for this entry."
        )

    return candidates


def build_current_leg_candidates(
    context: StrategyContext,
    *,
    include_ineligible: bool = False,
) -> list[StrategyCandidate]:
    """
    Return candidates for the active contest leg only.

    Candidates remain ordered by canonical risk-adjusted win probability.
    This function will become the input to Current Week Highest Win.
    """

    candidates = build_candidate_matrix(
        context,
        include_ineligible=include_ineligible,
    )

    current_leg_candidates = [
        candidate
        for candidate in candidates
        if candidate.contest_leg_id
        == context.current_contest_leg_id
    ]

    if not current_leg_candidates:
        raise CandidateBuilderError(
            "No candidates were found for the active contest leg."
        )

    return current_leg_candidates
