#!/usr/bin/env python3
"""
SemiSharp Future Value Strategy V2

Purpose
-------
Build a complete remaining-season survivor path that balances immediate
survival probability against the opportunity cost of using strong teams
too early.

Future Value is intended to be SemiSharp's primary practical
season-planning strategy.

Canonical Probability
---------------------
Every candidate is evaluated using:

    analytics.game_win_probabilities.risk_adjusted_wp

This strategy does not calculate its own win probability and does not
recreate risk adjustments.

Objective
---------
For each remaining contest leg, prefer a team with a strong current
risk-adjusted win probability while preserving teams that have
significantly better future opportunities.

The strategy uses:

    current log probability
    -
    future opportunity-cost penalty

A team receives a larger penalty when:

1. Its best future matchup is better than its current matchup.
2. It has relatively few strong future opportunities.
3. It is required to preserve a viable CIRCA holiday path.

Strategy Type
-------------
This is a season-planning strategy.

Unlike Current Week Highest Win, it returns one planned selection for
every remaining contest leg.

CIRCA Rules
-----------
Thanksgiving and Christmas are separate contest legs.

Before constructing the regular-week path, the strategy verifies that
distinct unused teams remain available for all future holiday legs.

Teams reserved for future holiday legs are not consumed during ordinary
weeks.

If no valid distinct-team holiday assignment exists, strategy execution
fails rather than silently generating an invalid path.

Eligibility Rules
-----------------
A candidate must:

1. Belong to the active contest format and remaining season.
2. Have a canonical risk-adjusted win probability.
3. Not have been used previously by the selected entry.
4. Not be selected more than once in the generated path.
5. Preserve CIRCA holiday feasibility.

Output
------
The response includes:

- complete remaining-season path
- current-leg primary recommendation
- current-leg alternatives
- estimated full-path survival probability
- conditional survival probability
- holiday reservations
- backend-generated rationale
- active model versions
- compatibility fields for the current frontend

Limitations
-----------
Future Value V2 is a deterministic, explainable greedy planner.

It is not the globally optimal benchmark. Dynamic Programming V2 will
serve as the reference optimizer, while Monte Carlo will model
probability uncertainty.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from app.services.candidate_builder import (
    CandidateBuilderError,
    StrategyCandidate,
    build_candidate_matrix,
)
from app.services.path_optimizer import (
    HolidayFeasibility,
    PathOptimizerError,
    candidate_probability,
    check_circa_holiday_feasibility,
    evaluate_path,
    expected_remaining_leg_ids,
    path_preserves_circa_holidays,
)
from app.services.strategy_context_service import (
    StrategyContext,
    StrategyContextError,
    build_strategy_context,
)


STRATEGY_CODE = "FUTURE_VALUE"
STRATEGY_VERSION = "2.0"

# Explainable policy default.
#
# A higher value preserves teams more aggressively for future matchups.
# A lower value behaves more like a current-probability strategy.
FUTURE_VALUE_WEIGHT = 0.35


@dataclass(frozen=True, slots=True)
class ScoredCandidate:
    """One candidate plus its Future Value policy measurements."""

    candidate: StrategyCandidate
    current_probability: float
    future_best_probability: float
    future_opportunity_count: int
    opportunity_cost: float
    scarcity_multiplier: float
    future_value_penalty: float
    policy_score: float
    preserves_holidays: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "current_probability": self.current_probability,
            "future_best_probability": (
                self.future_best_probability
            ),
            "future_opportunity_count": (
                self.future_opportunity_count
            ),
            "opportunity_cost": self.opportunity_cost,
            "scarcity_multiplier": self.scarcity_multiplier,
            "future_value_penalty": self.future_value_penalty,
            "policy_score": self.policy_score,
            "preserves_holidays": self.preserves_holidays,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate a Future Value survivor path using canonical "
            "risk-adjusted win probabilities."
        )
    )

    # Retained temporarily for compatibility with the existing API and
    # subprocess service layer.
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
    Reject stale request parameters instead of mixing them with the
    active backend context.
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


def candidates_by_leg(
    candidates: list[StrategyCandidate],
) -> dict[int, list[StrategyCandidate]]:
    """Group candidates by contest-leg ID."""
    grouped: dict[int, list[StrategyCandidate]] = {}

    for candidate in candidates:
        grouped.setdefault(
            candidate.contest_leg_id,
            [],
        ).append(candidate)

    for leg_candidates in grouped.values():
        leg_candidates.sort(
            key=lambda item: (
                -candidate_probability(item),
                -float(item.baseline_wp),
                item.team_abbr,
            )
        )

    return grouped


def future_opportunities(
    *,
    candidate: StrategyCandidate,
    all_candidates: list[StrategyCandidate],
    selected_team_ids: set[int],
) -> list[StrategyCandidate]:
    """
    Return later eligible opportunities for the same team.
    """
    return [
        future
        for future in all_candidates
        if future.team_id == candidate.team_id
        and future.leg_number > candidate.leg_number
        and future.team_id not in selected_team_ids
        and future.eligible
        and not future.already_used
    ]


def score_candidate(
    *,
    context: StrategyContext,
    candidate: StrategyCandidate,
    all_candidates: list[StrategyCandidate],
    partial_path: list[StrategyCandidate],
    selected_team_ids: set[int],
) -> ScoredCandidate:
    """
    Calculate the explainable Future Value policy score.

    Policy score:

        log(current adjusted probability)
        -
        future value penalty

    Future value penalty:

        max(0, future best probability - current probability)
        × FUTURE_VALUE_WEIGHT
        × scarcity multiplier

    Scarcity increases the penalty when a team has few future
    opportunities, preserving valuable teams when replacement choices
    are limited.
    """
    current_probability = candidate_probability(candidate)

    later_opportunities = future_opportunities(
        candidate=candidate,
        all_candidates=all_candidates,
        selected_team_ids=selected_team_ids,
    )

    if later_opportunities:
        future_best_probability = max(
            candidate_probability(item)
            for item in later_opportunities
        )
    else:
        future_best_probability = 0.0

    future_opportunity_count = len(later_opportunities)

    opportunity_cost = max(
        0.0,
        future_best_probability - current_probability,
    )

    # One future opportunity receives the strongest scarcity penalty.
    # The multiplier approaches 1.0 as more future options exist.
    if future_opportunity_count > 0:
        scarcity_multiplier = (
            1.0 + (1.0 / future_opportunity_count)
        )
    else:
        scarcity_multiplier = 1.0

    future_value_penalty = (
        FUTURE_VALUE_WEIGHT
        * opportunity_cost
        * scarcity_multiplier
    )

    proposed_path = [
        *partial_path,
        candidate,
    ]

    holiday_check = path_preserves_circa_holidays(
        context,
        all_candidates,
        proposed_path,
    )

    policy_score = (
        math.log(current_probability)
        - future_value_penalty
    )

    return ScoredCandidate(
        candidate=candidate,
        current_probability=current_probability,
        future_best_probability=future_best_probability,
        future_opportunity_count=future_opportunity_count,
        opportunity_cost=opportunity_cost,
        scarcity_multiplier=scarcity_multiplier,
        future_value_penalty=future_value_penalty,
        policy_score=policy_score,
        preserves_holidays=holiday_check.feasible,
    )


def holiday_reservation_map(
    holiday: HolidayFeasibility,
) -> dict[int, int]:
    """
    Convert the holiday-feasibility assignment into:

        contest_leg_id -> reserved team_id
    """
    return dict(
        zip(
            holiday.required_holiday_leg_ids,
            holiday.reserved_team_ids,
        )
    )


def build_rationale(
    scored: ScoredCandidate,
    *,
    rank: int | None = None,
    holiday_reserved: bool = False,
) -> str:
    """Generate deterministic backend rationale."""
    candidate = scored.candidate

    current_pct = scored.current_probability * 100
    future_pct = scored.future_best_probability * 100

    if holiday_reserved:
        explanation = (
            f"Selected for {candidate.leg_name} because this team was "
            "reserved by the CIRCA holiday-feasibility constraint."
        )
    else:
        prefix = (
            f"Ranked #{rank}. "
            if rank is not None
            else ""
        )

        explanation = (
            f"{prefix}Current risk-adjusted win probability is "
            f"{current_pct:.2f}%."
        )

    if scored.future_best_probability > 0:
        explanation += (
            f" Best later opportunity is {future_pct:.2f}% across "
            f"{scored.future_opportunity_count} remaining matchup(s)."
        )
    else:
        explanation += (
            " No stronger later opportunity was identified."
        )

    explanation += (
        f" Future-value penalty is "
        f"{scored.future_value_penalty:.4f}; "
        f"policy score is {scored.policy_score:.4f}."
    )

    if candidate.risk_level:
        explanation += (
            f" Risk level is {candidate.risk_level}"
        )

        if candidate.risk_score is not None:
            explanation += (
                f" with {float(candidate.risk_score):.1f} "
                "risk points."
            )
        else:
            explanation += "."

    return explanation


def scored_candidate_to_pick(
    scored: ScoredCandidate,
    *,
    rank: int | None = None,
    holiday_reserved: bool = False,
) -> dict[str, Any]:
    """Convert a scored candidate into the strategy response format."""
    candidate = scored.candidate

    projected_line = None

    if candidate.candidate_projected_spread is not None:
        projected_line = (
            f"{candidate.team_abbr} "
            f"{float(candidate.candidate_projected_spread):.1f}"
        )

    return {
        # Compatibility fields
        "leg": candidate.leg_number,
        "team": candidate.team_abbr,
        "risk": candidate.risk_stars,
        "adjusted_score": round(
            scored.policy_score,
            6,
        ),

        # V2 fields
        "rank": rank,
        "contest_leg_id": candidate.contest_leg_id,
        "leg_number": candidate.leg_number,
        "leg_code": candidate.leg_code,
        "leg_name": candidate.leg_name,
        "nfl_week": candidate.nfl_week,
        "is_special_leg": candidate.is_special_leg,
        "special_leg_type": candidate.special_leg_type,
        "holiday_reserved": holiday_reserved,
        "game_id": candidate.game_id,
        "team_id": candidate.team_id,
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
        "future_best_probability": (
            scored.future_best_probability
        ),
        "future_opportunity_count": (
            scored.future_opportunity_count
        ),
        "opportunity_cost": scored.opportunity_cost,
        "scarcity_multiplier": scored.scarcity_multiplier,
        "future_value_penalty": (
            scored.future_value_penalty
        ),
        "policy_score": scored.policy_score,
        "preserves_holidays": scored.preserves_holidays,
        "probability_model": candidate.probability_model,
        "projection_model": candidate.projection_model,
        "risk_model": candidate.risk_model,
        "rationale": build_rationale(
            scored,
            rank=rank,
            holiday_reserved=holiday_reserved,
        ),
    }


def construct_future_value_path(
    *,
    context: StrategyContext,
    all_candidates: list[StrategyCandidate],
    holiday: HolidayFeasibility,
) -> tuple[
    list[StrategyCandidate],
    list[ScoredCandidate],
    list[ScoredCandidate],
]:
    """
    Construct one deterministic remaining-season Future Value path.

    Returns:

    1. selected candidate path
    2. selected scored candidates
    3. ranked current-leg candidates
    """
    grouped = candidates_by_leg(all_candidates)

    leg_metadata = sorted({
        (
            candidate.leg_number,
            candidate.contest_leg_id,
        )
        for candidate in all_candidates
    })

    reservations = holiday_reservation_map(holiday)

    selected_path: list[StrategyCandidate] = []
    selected_scores: list[ScoredCandidate] = []
    selected_team_ids = set(context.used_team_ids)

    current_leg_ranked: list[ScoredCandidate] = []

    for leg_number, leg_id in leg_metadata:
        leg_candidates = grouped.get(leg_id, [])

        if not leg_candidates:
            raise PathOptimizerError(
                f"No candidates exist for contest leg {leg_id}."
            )

        reserved_team_id = reservations.get(leg_id)

        scored_options: list[ScoredCandidate] = []

        for candidate in leg_candidates:
            if candidate.team_id in selected_team_ids:
                continue

            if not candidate.eligible or candidate.already_used:
                continue

            # Do not consume a team reserved for a future holiday leg
            # during an ordinary contest leg.
            reserved_for_future_holiday = any(
                reserved_leg_id != leg_id
                and reserved_candidate_team_id
                == candidate.team_id
                and reserved_leg_id > leg_id
                for (
                    reserved_leg_id,
                    reserved_candidate_team_id,
                ) in reservations.items()
            )

            if reserved_for_future_holiday:
                continue

            # For the holiday leg itself, require the reservation chosen
            # by the feasibility assignment.
            if (
                reserved_team_id is not None
                and candidate.team_id != reserved_team_id
            ):
                continue

            scored = score_candidate(
                context=context,
                candidate=candidate,
                all_candidates=all_candidates,
                partial_path=selected_path,
                selected_team_ids=selected_team_ids,
            )

            if not scored.preserves_holidays:
                continue

            scored_options.append(scored)

        if not scored_options:
            raise PathOptimizerError(
                "No valid Future Value candidate remains for "
                f"contest leg {leg_id}."
            )

        scored_options.sort(
            key=lambda item: (
                -item.policy_score,
                -item.current_probability,
                -float(item.candidate.baseline_wp),
                item.candidate.team_abbr,
            )
        )

        if leg_id == context.current_contest_leg_id:
            current_leg_ranked = list(scored_options)

        selected = scored_options[0]

        selected_path.append(selected.candidate)
        selected_scores.append(selected)
        selected_team_ids.add(selected.candidate.team_id)

    return (
        selected_path,
        selected_scores,
        current_leg_ranked,
    )


def run_strategy(args: argparse.Namespace) -> dict[str, Any]:
    context = build_strategy_context(
        entry_id=args.entry_id,
        contest_format=args.contest_format,
        contest_leg_id=args.contest_leg_id,
    )

    validate_request_against_context(args, context)

    all_candidates = build_candidate_matrix(
        context,
        include_ineligible=False,
    )

    holiday = check_circa_holiday_feasibility(
        context,
        all_candidates,
    )

    if not holiday.feasible:
        raise PathOptimizerError(
            holiday.reason
            or "CIRCA holiday path is not feasible."
        )

    (
        selected_path,
        selected_scores,
        current_leg_ranked,
    ) = construct_future_value_path(
        context=context,
        all_candidates=all_candidates,
        holiday=holiday,
    )

    required_leg_ids = expected_remaining_leg_ids(
        context,
        all_candidates,
    )

    metrics = evaluate_path(
        context,
        selected_path,
        required_leg_ids=required_leg_ids,
    )

    if not metrics.is_valid:
        raise PathOptimizerError(
            "Generated Future Value path failed validation: "
            + "; ".join(metrics.validation_errors)
        )

    score_by_leg_id = {
        scored.candidate.contest_leg_id: scored
        for scored in selected_scores
    }

    reservation_map = holiday_reservation_map(holiday)

    picks = [
        scored_candidate_to_pick(
            score_by_leg_id[candidate.contest_leg_id],
            holiday_reserved=(
                candidate.contest_leg_id
                in reservation_map
            ),
        )
        for candidate in selected_path
    ]

    primary_recommendation = next(
        (
            pick
            for pick in picks
            if pick["contest_leg_id"]
            == context.current_contest_leg_id
        ),
        None,
    )

    alternatives = [
        scored_candidate_to_pick(
            scored,
            rank=rank,
        )
        for rank, scored in enumerate(
            current_leg_ranked[1:3],
            start=2,
        )
    ]

    holiday_reservations = []

    for leg_id, team_id in reservation_map.items():
        matching = next(
            (
                candidate
                for candidate in all_candidates
                if candidate.contest_leg_id == leg_id
                and candidate.team_id == team_id
            ),
            None,
        )

        if matching is not None:
            holiday_reservations.append({
                "contest_leg_id": leg_id,
                "leg_number": matching.leg_number,
                "leg_code": matching.leg_code,
                "leg_name": matching.leg_name,
                "special_leg_type": (
                    matching.special_leg_type
                ),
                "team_id": team_id,
                "team": matching.team_abbr,
                "opponent": matching.opponent_team_abbr,
                "risk_adjusted_wp": float(
                    matching.risk_adjusted_wp
                ),
            })

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

        # Current frontend compatibility
        "alternative_recommendations": alternatives,
        "alts": alternatives,
        "picks": picks,
    }

    return {
        "strategy": STRATEGY_CODE,
        "strategy_version": STRATEGY_VERSION,
        "strategy_type": "SEASON_PATH",
        "objective": (
            "Balance current risk-adjusted win probability "
            "against future opportunity cost while preserving "
            "CIRCA holiday feasibility."
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
        "future_value_weight": FUTURE_VALUE_WEIGHT,
        "models": {
            "projection_model": context.projection_model,
            "hfa_source": context.hfa_source,
            "risk_model": context.risk_model,
            "probability_model": (
                context.probability_model
            ),
        },
        "path_metrics": metrics.to_dict(),
        "estimated_path_survival_probability": (
            metrics.estimated_path_survival_probability
        ),
        "conditional_survival_probability": (
            metrics.conditional_survival_probability
        ),
        "holiday_feasibility": holiday.to_dict(),
        "holiday_reservations": holiday_reservations,
        "primary_recommendation": primary_recommendation,
        "alternative_recommendations": alternatives,
        "picks": picks,

        # Existing frontend/API compatibility envelope.
        "entries": [entry_payload],
    }


def main() -> None:
    args = parse_args()

    try:
        output = run_strategy(args)

    except (
        StrategyContextError,
        CandidateBuilderError,
        PathOptimizerError,
    ) as exc:
        print(
            json.dumps(
                {
                    "strategy": STRATEGY_CODE,
                    "strategy_version": STRATEGY_VERSION,
                    "status": "ERROR",
                    "error": str(exc),
                },
                indent=2,
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
