#!/usr/bin/env python3
"""
SemiSharp Bottom Six Road Fade Strategy V2

Purpose
-------
Build a remaining-season survivor path that prefers selecting the home
team playing against one of the six lowest-rated teams when that
bottom-six opponent is on the road.

Canonical Probability
---------------------
All candidate comparisons use:

    analytics.game_win_probabilities.risk_adjusted_wp

The Bottom Six rule is a policy preference. It does not replace the
canonical probability model.

Bottom Six Definition
---------------------
The bottom six teams are the six teams with the lowest
point_spread_rating in:

    ratings.pff_power_ratings

for the active season and rating week.

Policy
------
For each remaining contest leg:

1. Prefer eligible home teams whose opponent:
   - belongs to the bottom-six rating tier, and
   - is the away team.
2. Rank qualifying candidates by risk_adjusted_wp descending.
3. If no qualifying candidate remains, fall back to all eligible
   candidates ranked by risk_adjusted_wp.
4. Never reuse a team.
5. Preserve distinct Thanksgiving and Christmas selections for CIRCA.

CIRCA Rules
-----------
Thanksgiving and Christmas are separate contest legs.

The strategy verifies holiday feasibility before planning and prevents
ordinary-week selections from consuming teams reserved for future
holiday legs.

Output
------
The response includes:

- one path for every active survivor entry
- one pick per remaining contest leg
- bottom-six target metadata
- primary current-leg recommendation
- current-leg alternatives
- full-path survival probability
- conditional survival probability
- holiday reservations
- backend-generated rationale
- active model versions

Limitations
-----------
This is a deterministic policy strategy, not a globally optimal solver.

Dynamic Programming V2 will serve as the benchmark optimizer.
"""

from __future__ import annotations

import argparse
import json
from decimal import Decimal
from typing import Any

from app.db import get_connection
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


STRATEGY_CODE = "BOTTOM_SIX_ROAD_FADE"
STRATEGY_VERSION = "2.0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build a survivor path preferring home teams facing "
            "bottom-six road opponents."
        )
    )

    parser.add_argument("--season", type=int, required=True)
    parser.add_argument(
        "--contest-format",
        choices=["STANDARD", "CIRCA"],
        required=True,
    )
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)

    # Optional during migration. When omitted, all active entries run,
    # preserving the existing endpoint behavior.
    parser.add_argument("--entry-id", type=int)

    return parser.parse_args()


def decimal_to_float(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)

    return value


def validate_request_against_context(
    args: argparse.Namespace,
    context: StrategyContext,
) -> None:
    """Reject request values that conflict with backend context."""
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


def load_active_entry_ids(
    requested_entry_id: int | None,
) -> list[int]:
    """
    Return one requested active entry or every active entry.

    The existing API does not yet supply entry_id for this strategy, so
    the all-active-entries behavior remains temporarily supported.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            if requested_entry_id is not None:
                cursor.execute(
                    """
                    SELECT entry_id
                    FROM survivor.entries
                    WHERE entry_id = %s
                      AND is_active = TRUE;
                    """,
                    (requested_entry_id,),
                )
            else:
                cursor.execute(
                    """
                    SELECT entry_id
                    FROM survivor.entries
                    WHERE is_active = TRUE
                    ORDER BY entry_id;
                    """
                )

            rows = cursor.fetchall()

    entry_ids = [int(row[0]) for row in rows]

    if not entry_ids:
        raise StrategyContextError(
            "No active survivor entries were found."
        )

    return entry_ids


def load_bottom_six(
    *,
    season: int,
    rating_week: int,
) -> list[dict[str, Any]]:
    """
    Load the six lowest PFF point-spread ratings.

    Team ID is authoritative. Team abbreviation is included for
    explanation and auditing.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    r.team_id,
                    t.team_abbr,
                    r.pff_team_code,
                    r.point_spread_rating
                FROM ratings.pff_power_ratings r
                JOIN reference.teams t
                  ON t.team_id = r.team_id
                WHERE r.season = %s
                  AND r.week = %s
                ORDER BY
                    r.point_spread_rating ASC,
                    t.team_abbr ASC
                LIMIT 6;
                """,
                (
                    season,
                    rating_week,
                ),
            )

            columns = [
                description[0]
                for description in cursor.description
            ]

            rows = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]

    if len(rows) != 6:
        raise PathOptimizerError(
            "Expected six bottom-tier teams for "
            f"season {season}, rating week {rating_week}; "
            f"found {len(rows)}."
        )

    return rows


def group_candidates_by_leg(
    candidates: list[StrategyCandidate],
) -> dict[int, list[StrategyCandidate]]:
    """Group and canonically order candidates by contest leg."""
    grouped: dict[int, list[StrategyCandidate]] = {}

    for candidate in candidates:
        grouped.setdefault(
            candidate.contest_leg_id,
            [],
        ).append(candidate)

    for items in grouped.values():
        items.sort(
            key=lambda candidate: (
                -candidate_probability(candidate),
                -float(candidate.baseline_wp),
                candidate.team_abbr,
            )
        )

    return grouped


def reservation_map(
    holiday: HolidayFeasibility,
) -> dict[int, int]:
    """Return contest-leg ID mapped to reserved holiday team ID."""
    return dict(
        zip(
            holiday.required_holiday_leg_ids,
            holiday.reserved_team_ids,
        )
    )


def is_bottom_six_road_fade(
    candidate: StrategyCandidate,
    bottom_six_team_ids: set[int],
) -> bool:
    """
    A qualifying fade candidate must be the home team facing a bottom-six
    opponent that is playing away.
    """
    return (
        candidate.team_location == "HOME"
        and candidate.opponent_team_id in bottom_six_team_ids
        and candidate.opponent_team_id == candidate.away_team_id
    )


def build_rationale(
    candidate: StrategyCandidate,
    *,
    is_targeted_fade: bool,
    bottom_six_abbreviations: set[str],
) -> str:
    """Generate deterministic backend rationale."""
    adjusted_pct = candidate_probability(candidate) * 100

    if is_targeted_fade:
        explanation = (
            f"Targeted home matchup against bottom-six road opponent "
            f"{candidate.opponent_team_abbr}. "
        )
    else:
        explanation = (
            "Fallback selection because no eligible bottom-six road "
            "fade candidate remained for this contest leg. "
        )

    explanation += (
        f"{candidate.team_abbr} has a {adjusted_pct:.2f}% "
        "risk-adjusted win probability."
    )

    if candidate.candidate_projected_spread is not None:
        explanation += (
            " Candidate-side projected spread is "
            f"{float(candidate.candidate_projected_spread):.1f}."
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

    if candidate.opponent_team_abbr in bottom_six_abbreviations:
        explanation += (
            f" {candidate.opponent_team_abbr} is in the active "
            "bottom-six rating tier."
        )

    return explanation


def candidate_to_pick(
    candidate: StrategyCandidate,
    *,
    is_targeted_fade: bool,
    holiday_reserved: bool,
    bottom_six_abbreviations: set[str],
) -> dict[str, Any]:
    """Convert one selected candidate into the response schema."""
    projected_line = None

    if candidate.candidate_projected_spread is not None:
        projected_line = (
            f"{candidate.team_abbr} "
            f"{float(candidate.candidate_projected_spread):.1f}"
        )

    return {
        "leg_number": candidate.leg_number,
        "leg_code": candidate.leg_code,
        "leg_name": candidate.leg_name,
        "contest_leg_id": candidate.contest_leg_id,
        "nfl_week": candidate.nfl_week,
        "is_special_leg": candidate.is_special_leg,
        "special_leg_type": candidate.special_leg_type,
        "holiday_reserved": holiday_reserved,
        "game_id": candidate.game_id,
        "team_id": candidate.team_id,
        "team": candidate.team_abbr,
        "team_name": candidate.team_name,
        "team_location": candidate.team_location,
        "opponent_team_id": candidate.opponent_team_id,
        "opponent": candidate.opponent_team_abbr,
        "home_team": candidate.home_team_abbr,
        "away_team": candidate.away_team_abbr,
        "is_bottom_six_road_fade": is_targeted_fade,
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
        "probability_model": candidate.probability_model,
        "projection_model": candidate.projection_model,
        "risk_model": candidate.risk_model,
        "rationale": build_rationale(
            candidate,
            is_targeted_fade=is_targeted_fade,
            bottom_six_abbreviations=(
                bottom_six_abbreviations
            ),
        ),
    }


def construct_path(
    *,
    context: StrategyContext,
    candidates: list[StrategyCandidate],
    bottom_six_team_ids: set[int],
    holiday: HolidayFeasibility,
) -> tuple[
    list[StrategyCandidate],
    dict[int, bool],
    list[StrategyCandidate],
]:
    """
    Build the deterministic Bottom Six Road Fade path.

    Returns:

    1. selected path
    2. contest-leg ID -> targeted-fade flag
    3. ranked current-leg alternatives
    """
    grouped = group_candidates_by_leg(candidates)

    leg_order = sorted({
        (
            candidate.leg_number,
            candidate.contest_leg_id,
        )
        for candidate in candidates
    })

    reservations = reservation_map(holiday)

    selected_path: list[StrategyCandidate] = []
    selected_team_ids = set(context.used_team_ids)
    targeted_by_leg: dict[int, bool] = {}
    current_leg_ranked: list[StrategyCandidate] = []

    for _, leg_id in leg_order:
        leg_candidates = grouped.get(leg_id, [])

        reserved_team_id = reservations.get(leg_id)

        valid_candidates: list[StrategyCandidate] = []

        for candidate in leg_candidates:
            if candidate.team_id in selected_team_ids:
                continue

            if not candidate.eligible or candidate.already_used:
                continue

            reserved_for_later_holiday = any(
                reserved_leg_id != leg_id
                and reserved_leg_id > leg_id
                and reserved_team_id_value
                == candidate.team_id
                for (
                    reserved_leg_id,
                    reserved_team_id_value,
                ) in reservations.items()
            )

            if reserved_for_later_holiday:
                continue

            if (
                reserved_team_id is not None
                and candidate.team_id != reserved_team_id
            ):
                continue

            proposed_path = [
                *selected_path,
                candidate,
            ]

            holiday_check = path_preserves_circa_holidays(
                context,
                candidates,
                proposed_path,
            )

            if not holiday_check.feasible:
                continue

            valid_candidates.append(candidate)

        if not valid_candidates:
            raise PathOptimizerError(
                "No eligible Bottom Six Road Fade candidate "
                f"remains for contest leg {leg_id}."
            )

        targeted = [
            candidate
            for candidate in valid_candidates
            if is_bottom_six_road_fade(
                candidate,
                bottom_six_team_ids,
            )
        ]

        selection_pool = (
            targeted
            if targeted
            else valid_candidates
        )

        selection_pool.sort(
            key=lambda candidate: (
                -candidate_probability(candidate),
                -float(candidate.baseline_wp),
                candidate.team_abbr,
            )
        )

        if leg_id == context.current_contest_leg_id:
            current_leg_ranked = list(selection_pool)

        selected = selection_pool[0]

        selected_path.append(selected)
        selected_team_ids.add(selected.team_id)
        targeted_by_leg[leg_id] = bool(targeted)

    return (
        selected_path,
        targeted_by_leg,
        current_leg_ranked,
    )


def run_for_entry(
    *,
    args: argparse.Namespace,
    entry_id: int,
    bottom_six: list[dict[str, Any]],
) -> dict[str, Any]:
    """Run the V2 policy for one survivor entry."""
    context = build_strategy_context(
        entry_id=entry_id,
        contest_format=args.contest_format,
    )

    validate_request_against_context(args, context)

    candidates = build_candidate_matrix(
        context,
        include_ineligible=False,
    )

    holiday = check_circa_holiday_feasibility(
        context,
        candidates,
    )

    if not holiday.feasible:
        raise PathOptimizerError(
            holiday.reason
            or "CIRCA holiday path is not feasible."
        )

    bottom_six_team_ids = {
        int(item["team_id"])
        for item in bottom_six
    }

    bottom_six_abbreviations = {
        str(item["team_abbr"])
        for item in bottom_six
    }

    (
        selected_path,
        targeted_by_leg,
        current_leg_ranked,
    ) = construct_path(
        context=context,
        candidates=candidates,
        bottom_six_team_ids=bottom_six_team_ids,
        holiday=holiday,
    )

    required_leg_ids = expected_remaining_leg_ids(
        context,
        candidates,
    )

    metrics = evaluate_path(
        context,
        selected_path,
        required_leg_ids=required_leg_ids,
    )

    if not metrics.is_valid:
        raise PathOptimizerError(
            "Generated Bottom Six path failed validation: "
            + "; ".join(metrics.validation_errors)
        )

    reservations = reservation_map(holiday)

    picks = [
        candidate_to_pick(
            candidate,
            is_targeted_fade=targeted_by_leg[
                candidate.contest_leg_id
            ],
            holiday_reserved=(
                candidate.contest_leg_id
                in reservations
            ),
            bottom_six_abbreviations=(
                bottom_six_abbreviations
            ),
        )
        for candidate in selected_path
    ]

    primary = next(
        (
            pick
            for pick in picks
            if pick["contest_leg_id"]
            == context.current_contest_leg_id
        ),
        None,
    )

    alternatives = [
        candidate_to_pick(
            candidate,
            is_targeted_fade=is_bottom_six_road_fade(
                candidate,
                bottom_six_team_ids,
            ),
            holiday_reserved=False,
            bottom_six_abbreviations=(
                bottom_six_abbreviations
            ),
        )
        for candidate in current_leg_ranked[1:3]
    ]

    targeted_pick_count = sum(
        1
        for value in targeted_by_leg.values()
        if value
    )

    return {
        "entry_id": context.entry_id,
        "user_id": context.user_id,
        "survivor_sweat_name": (
            context.survivor_sweat_name
        ),
        "used_team_ids": list(context.used_team_ids),
        "used_team_abbreviations": list(
            context.used_team_abbreviations
        ),
        "primary_recommendation": primary,
        "alternative_recommendations": alternatives,
        "picks": picks,
        "targeted_pick_count": targeted_pick_count,
        "path_metrics": metrics.to_dict(),
        "estimated_path_survival_probability": (
            metrics.estimated_path_survival_probability
        ),
        "conditional_survival_probability": (
            metrics.conditional_survival_probability
        ),
        "holiday_feasibility": holiday.to_dict(),
    }


def run_strategy(args: argparse.Namespace) -> dict[str, Any]:
    entry_ids = load_active_entry_ids(args.entry_id)

    bottom_six = load_bottom_six(
        season=args.season,
        rating_week=args.rating_week,
    )

    entries = [
        run_for_entry(
            args=args,
            entry_id=entry_id,
            bottom_six=bottom_six,
        )
        for entry_id in entry_ids
    ]

    return {
        "strategy": STRATEGY_CODE,
        "strategy_version": STRATEGY_VERSION,
        "strategy_type": "SEASON_PATH",
        "objective": (
            "Prefer home teams facing bottom-six road opponents, "
            "ranked by canonical risk-adjusted win probability."
        ),
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "bottom_six": [
            {
                "team_id": int(item["team_id"]),
                "team": item["team_abbr"],
                "pff_team_code": item["pff_team_code"],
                "point_spread_rating": decimal_to_float(
                    item["point_spread_rating"]
                ),
            }
            for item in bottom_six
        ],
        "entry_count": len(entries),
        "entries": entries,
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
