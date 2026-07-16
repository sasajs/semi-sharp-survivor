#!/usr/bin/env python3
"""
SemiSharp Current Week Highest Win Strategy V2

Purpose
-------
Produce a ranked list of eligible survivor selections for the active
contest leg.

Unlike season-planning strategies, Current Week Highest Win does not
construct a multi-week path. It answers a narrower question:

    Which eligible team has the highest risk-adjusted probability of
    winning the active contest leg?

Canonical Probability
---------------------
All rankings use:

    analytics.game_win_probabilities.risk_adjusted_wp

The strategy does not calculate its own win probabilities and does not
recreate risk-adjusted spreads.

Inputs
------
The existing command-line interface remains temporarily compatible with
the FastAPI subprocess service:

- season
- contest format
- rating week
- HFA source
- entry ID
- optional contest leg ID

The backend StrategyContext is the authoritative source for active season,
week, models, entry state, contest leg, and used-team history.

Eligibility Rules
-----------------
A team is eligible when:

1. It is scheduled for the active contest leg.
2. It has not previously been used by the selected survivor entry.
3. It has a canonical probability record matching the active probability
   model.
4. It belongs to an active NFL franchise record.

Ranking Rules
-------------
Primary ranking:

    risk_adjusted_wp descending

Tie breaking:

1. baseline_wp descending
2. projected favorite before underdog
3. projected spread strength descending
4. team abbreviation ascending

Circa Rules
-----------
For regular CIRCA weeks, Thanksgiving and Christmas games are excluded
from the normal weekly leg.

When an explicit holiday contest_leg_id is supplied, only games belonging
to that holiday leg are ranked.

Output
------
The response includes:

- complete ranked current-leg recommendation board
- primary recommendation
- alternative recommendations
- model versions
- backend-generated rationale
- entry and contest context

Temporary Compatibility
-----------------------
The response also retains the existing entries/picks envelope so the
current frontend does not fail while the new API contract is introduced.

Limitations
-----------
This strategy performs no future-value optimization and does not reserve
teams for later weeks. Season-planning strategies are responsible for
holiday preservation and long-term path optimization.
"""

from __future__ import annotations

import argparse
import json
from decimal import Decimal
from typing import Any

from app.services.candidate_builder import (
    CandidateBuilderError,
    StrategyCandidate,
    build_current_leg_candidates,
)
from app.services.strategy_context_service import (
    StrategyContext,
    StrategyContextError,
    build_strategy_context,
)


STRATEGY_CODE = "CURRENT_WEEK_HIGHEST_WIN"
STRATEGY_VERSION = "2.0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Rank eligible teams for the active survivor contest leg "
            "using canonical risk-adjusted win probability."
        )
    )

    # These arguments remain for compatibility with the existing API and
    # subprocess service. StrategyContext remains authoritative.
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument(
        "--contest-format",
        choices=["STANDARD", "CIRCA"],
        required=True,
    )
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    parser.add_argument("--entry-id", type=int, required=True)
    parser.add_argument("--contest-leg-id", type=int)

    return parser.parse_args()


def validate_request_against_context(
    args: argparse.Namespace,
    context: StrategyContext,
) -> None:
    """
    Reject stale or conflicting API parameters.

    During migration, the route still supplies season, rating week, and
    HFA source. Those values must agree with the active backend context.
    The strategy must not silently mix request parameters with active
    model state.
    """
    errors: list[str] = []

    if args.season != context.season:
        errors.append(
            f"requested season {args.season} does not match "
            f"active season {context.season}"
        )

    if args.rating_week != context.rating_week:
        errors.append(
            f"requested rating week {args.rating_week} does not match "
            f"active rating week {context.rating_week}"
        )

    if args.hfa_source != context.hfa_source:
        errors.append(
            f"requested HFA source {args.hfa_source} does not match "
            f"active HFA source {context.hfa_source}"
        )

    if errors:
        raise StrategyContextError("; ".join(errors))


def decimal_to_float(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)

    return value


def build_rationale(
    candidate: StrategyCandidate,
    *,
    rank: int,
) -> str:
    """
    Generate deterministic backend rationale.

    The frontend must display this explanation as supplied and must not
    invent its own analytical interpretation.
    """
    adjusted_pct = float(candidate.risk_adjusted_wp) * 100
    baseline_pct = float(candidate.baseline_wp) * 100

    explanation = (
        f"Ranked #{rank} for the active contest leg with a "
        f"{adjusted_pct:.2f}% risk-adjusted win probability "
        f"and {baseline_pct:.2f}% baseline win probability."
    )

    if candidate.candidate_projected_spread is not None:
        explanation += (
            " SemiSharp projects the candidate-side spread at "
            f"{float(candidate.candidate_projected_spread):.1f}."
        )

    if candidate.risk_level:
        explanation += (
            f" Risk Engine assessment: {candidate.risk_level}"
        )

        if candidate.risk_score is not None:
            explanation += (
                f" ({float(candidate.risk_score):.1f} risk points)."
            )
        else:
            explanation += "."

    if candidate.already_used:
        explanation += (
            " This team is marked unavailable because it was already "
            "used by the selected entry."
        )

    return explanation


def candidate_to_recommendation(
    candidate: StrategyCandidate,
    *,
    rank: int,
) -> dict[str, Any]:
    """
    Convert a canonical candidate into the strategy response schema.
    """
    projected_line = None

    if candidate.candidate_projected_spread is not None:
        projected_line = (
            f"{candidate.team_abbr} "
            f"{float(candidate.candidate_projected_spread):.1f}"
        )

    return {
        "rank": rank,
        "is_primary": rank == 1,
        "is_alternative": rank in (2, 3),
        "contest_leg_id": candidate.contest_leg_id,
        "leg_number": candidate.leg_number,
        "leg_code": candidate.leg_code,
        "leg_name": candidate.leg_name,
        "nfl_week": candidate.nfl_week,
        "is_special_leg": candidate.is_special_leg,
        "special_leg_type": candidate.special_leg_type,
        "game_id": candidate.game_id,
        "team_id": candidate.team_id,
        "team": candidate.team_abbr,
        "team_name": candidate.team_name,
        "team_location": candidate.team_location,
        "opponent_team_id": candidate.opponent_team_id,
        "opponent": candidate.opponent_team_abbr,
        "home_team": candidate.home_team_abbr,
        "away_team": candidate.away_team_abbr,
        "gameday": candidate.gameday,
        "gametime": candidate.gametime,
        "baseline_wp": decimal_to_float(
            candidate.baseline_wp
        ),
        "risk_adjusted_wp": decimal_to_float(
            candidate.risk_adjusted_wp
        ),
        "risk_discount_factor": decimal_to_float(
            candidate.risk_discount_factor
        ),
        "projected_spread": decimal_to_float(
            candidate.candidate_projected_spread
        ),
        "projected_line": projected_line,
        "market_spread": decimal_to_float(
            candidate.market_spread
        ),
        "market_price": decimal_to_float(
            candidate.market_price
        ),
        "sportsbook_count": candidate.sportsbook_count,
        "edge_points": decimal_to_float(
            candidate.edge_points
        ),
        "risk_score": decimal_to_float(
            candidate.risk_score
        ),
        "risk_points": decimal_to_float(
            candidate.risk_score
        ),
        "risk_stars": candidate.risk_stars,
        "risk_level": candidate.risk_level,
        "risk_summary": candidate.risk_summary,
        "already_used": candidate.already_used,
        "eligible": candidate.eligible,
        "probability_model": candidate.probability_model,
        "projection_model": candidate.projection_model,
        "risk_model": candidate.risk_model,
        "rationale": build_rationale(
            candidate,
            rank=rank,
        ),
    }


def sort_candidates(
    candidates: list[StrategyCandidate],
) -> list[StrategyCandidate]:
    """
    Apply deterministic ranking and tie-breaking.

    CandidateBuilder already orders by risk-adjusted probability, but the
    strategy explicitly applies its policy so behavior remains testable
    and independent of SQL ordering.
    """

    def sort_key(candidate: StrategyCandidate):
        adjusted_wp = float(candidate.risk_adjusted_wp)
        baseline_wp = float(candidate.baseline_wp)

        is_projected_favorite = int(
            candidate.team_id
            == candidate.projected_favorite_team_id
        )

        spread_strength = 0.0

        if candidate.candidate_projected_spread is not None:
            spread_strength = abs(
                float(candidate.candidate_projected_spread)
            )

        return (
            -adjusted_wp,
            -baseline_wp,
            -is_projected_favorite,
            -spread_strength,
            candidate.team_abbr,
        )

    return sorted(candidates, key=sort_key)


def run_strategy(args: argparse.Namespace) -> dict[str, Any]:
    context = build_strategy_context(
        entry_id=args.entry_id,
        contest_format=args.contest_format,
        contest_leg_id=args.contest_leg_id,
    )

    validate_request_against_context(args, context)

    candidates = build_current_leg_candidates(
        context,
        include_ineligible=False,
    )

    ranked_candidates = sort_candidates(candidates)

    recommendations = [
        candidate_to_recommendation(
            candidate,
            rank=rank,
        )
        for rank, candidate in enumerate(
            ranked_candidates,
            start=1,
        )
    ]

    primary_recommendation = (
        recommendations[0]
        if recommendations
        else None
    )

    alternative_recommendations = recommendations[1:3]

    entry_payload = {
        "entry_id": context.entry_id,
        "user_id": context.user_id,
        "survivor_sweat_name": (
            context.survivor_sweat_name
        ),
        "used_team_ids": list(context.used_team_ids),
        "used_team_abbreviations": list(
            context.used_team_abbreviations
        ),
        "primary_recommendation": primary_recommendation,
        "alternative_recommendations": (
            alternative_recommendations
        ),

        # Temporary compatibility field. It now contains the ranked
        # current-leg board, not a full-season path.
        "picks": recommendations,
    }

    return {
        "strategy": STRATEGY_CODE,
        "strategy_version": STRATEGY_VERSION,
        "strategy_type": "CURRENT_LEG_RANKING",
        "objective": (
            "Rank eligible teams by canonical risk-adjusted "
            "win probability for the active contest leg."
        ),
        "season": context.season,
        "current_week": context.current_week,
        "rating_week": context.rating_week,
        "contest_format": context.contest_format,
        "current_contest_leg_id": (
            context.current_contest_leg_id
        ),
        "current_leg_number": context.current_leg_number,
        "current_leg_code": context.current_leg_code,
        "current_leg_name": context.current_leg_name,
        "current_leg_special_type": (
            context.current_leg_special_type
        ),
        "ranking_method": (
            "risk_adjusted_wp DESC, baseline_wp DESC, "
            "projected_favorite DESC, spread_strength DESC"
        ),
        "models": {
            "projection_model": context.projection_model,
            "hfa_source": context.hfa_source,
            "risk_model": context.risk_model,
            "probability_model": (
                context.probability_model
            ),
        },
        "candidate_count": len(recommendations),
        "primary_recommendation": primary_recommendation,
        "alternative_recommendations": (
            alternative_recommendations
        ),
        "recommendations": recommendations,

        # Retained temporarily for the current frontend/API contract.
        "entries": [entry_payload],
    }


def main() -> None:
    args = parse_args()

    try:
        output = run_strategy(args)

    except (
        StrategyContextError,
        CandidateBuilderError,
    ) as exc:
        error_output = {
            "strategy": STRATEGY_CODE,
            "strategy_version": STRATEGY_VERSION,
            "status": "ERROR",
            "error": str(exc),
        }

        print(
            json.dumps(
                error_output,
                indent=2,
                default=str,
            )
        )
        raise SystemExit(1) from exc

    print(
        json.dumps(
            output,
            indent=2,
            default=str,
        )
    )


if __name__ == "__main__":
    main()
