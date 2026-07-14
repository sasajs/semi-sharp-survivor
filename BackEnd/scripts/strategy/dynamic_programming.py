#!/usr/bin/env python3
"""
SemiSharp Dynamic Programming Strategy V2

Purpose
-------
Produce the strongest remaining-season survivor path under the canonical
risk-adjusted win-probability model.

Dynamic Programming V2 serves as SemiSharp's reference optimization
strategy.

Canonical Objective
-------------------
Maximize:

    sum(log(risk_adjusted_wp))

This is mathematically equivalent to maximizing:

    product(risk_adjusted_wp)

but is more numerically stable across a full survivor season.

Canonical Probability
---------------------
All candidate probabilities come from:

    analytics.game_win_probabilities.risk_adjusted_wp

The strategy does not recreate probabilities from projected spreads.

Constraints
-----------
1. Exactly one selection per remaining contest leg.
2. A team may not be selected more than once.
3. Previously used entry teams remain unavailable.
4. CIRCA Thanksgiving and Christmas legs must remain feasible.
5. All model versions come from StrategyContext.
6. Candidates come only from the shared Candidate Builder.

Optimization Method
-------------------
The theoretical state space is very large:

    contest legs × combinations of previously used teams

An unrestricted exact search across every team and every remaining leg
would be unnecessarily expensive for local execution.

V2 therefore uses deterministic beam-search dynamic programming:

1. Advance one contest leg at a time.
2. Expand each retained state with eligible candidates.
3. Reject states that reuse teams or invalidate CIRCA holiday options.
4. Rank partial paths by cumulative log probability.
5. Retain only the strongest BEAM_WIDTH states.

This provides a low-cost, explainable approximation suitable for routine
weekly execution.

CIRCA Rules
-----------
Thanksgiving and Christmas are separate contest legs.

The search verifies that every partial regular-week path leaves a valid,
distinct-team assignment for remaining holiday legs.

Output
------
The response includes:

- one optimized path per active entry
- path log score
- estimated path survival probability
- conditional survival probability
- holiday selections
- primary current-leg recommendation
- current-leg alternatives
- optimization diagnostics
- active model versions

Limitations
-----------
Beam search is an approximation. It does not formally guarantee the
global optimum unless the beam is wide enough to retain every reachable
state.

The beam width and per-leg candidate limit are reported in the output for
auditability.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from app.db import get_connection
from app.services.candidate_builder import (
    CandidateBuilderError,
    StrategyCandidate,
    build_candidate_matrix,
)
from app.services.path_optimizer import (
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


STRATEGY_CODE = "DYNAMIC_PROGRAMMING_OPTIMIZATION"
STRATEGY_VERSION = "2.0"

# Cost-control defaults.
#
# Twelve candidates per leg preserves a broad decision set while avoiding
# expansion of obviously inferior underdogs in routine operation.
CANDIDATES_PER_LEG = 12

# Five thousand retained states keeps execution local and inexpensive.
BEAM_WIDTH = 5000


@dataclass(frozen=True, slots=True)
class SearchState:
    """
    One partial dynamic-programming state.
    """

    path: tuple[StrategyCandidate, ...]
    used_team_ids: frozenset[int]
    log_score: float

    @property
    def current_probability(self) -> float:
        if not self.path:
            return 1.0

        return candidate_probability(self.path[-1])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Optimize a survivor path using beam-search dynamic "
            "programming and canonical risk-adjusted probabilities."
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

    # Optional during migration. Existing API behavior runs all active
    # entries when no entry ID is supplied.
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
    """Reject stale request values."""
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
    """Return one requested entry or every active entry."""
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


def group_candidates_by_leg(
    candidates: list[StrategyCandidate],
) -> dict[int, list[StrategyCandidate]]:
    """
    Group candidates by contest leg and retain the strongest bounded set.
    """
    grouped: dict[int, list[StrategyCandidate]] = {}

    for candidate in candidates:
        if not candidate.eligible or candidate.already_used:
            continue

        grouped.setdefault(
            candidate.contest_leg_id,
            [],
        ).append(candidate)

    for leg_id, leg_candidates in grouped.items():
        leg_candidates.sort(
            key=lambda candidate: (
                -candidate_probability(candidate),
                -float(candidate.baseline_wp),
                -abs(
                    float(
                        candidate.candidate_projected_spread
                        or 0
                    )
                ),
                candidate.team_abbr,
            )
        )

        grouped[leg_id] = leg_candidates[
            :CANDIDATES_PER_LEG
        ]

    return grouped


def search_state_sort_key(
    state: SearchState,
) -> tuple[Any, ...]:
    """
    Deterministically rank beam states.

    Larger log score is better. Ties use the selected team sequence.
    """
    return (
        -state.log_score,
        tuple(
            candidate.team_abbr
            for candidate in state.path
        ),
    )


def prune_duplicate_states(
    states: list[SearchState],
) -> list[SearchState]:
    """
    Retain only the best state for each used-team set.

    At the same contest-leg depth, two states with identical used teams
    have identical future availability. Only the stronger score matters.
    """
    best_by_used_set: dict[
        frozenset[int],
        SearchState,
    ] = {}

    for state in states:
        existing = best_by_used_set.get(
            state.used_team_ids
        )

        if existing is None:
            best_by_used_set[state.used_team_ids] = state
            continue

        if search_state_sort_key(state) < (
            search_state_sort_key(existing)
        ):
            best_by_used_set[state.used_team_ids] = state

    unique_states = list(best_by_used_set.values())
    unique_states.sort(key=search_state_sort_key)

    return unique_states[:BEAM_WIDTH]


def optimize_path(
    *,
    context: StrategyContext,
    all_candidates: list[StrategyCandidate],
) -> tuple[
    list[StrategyCandidate],
    dict[str, Any],
]:
    """
    Optimize the complete remaining path with beam-search DP.
    """
    grouped = group_candidates_by_leg(all_candidates)

    leg_order = sorted({
        (
            candidate.leg_number,
            candidate.contest_leg_id,
        )
        for candidate in all_candidates
    })

    if not leg_order:
        raise PathOptimizerError(
            "No remaining contest legs were found."
        )

    initial_state = SearchState(
        path=(),
        used_team_ids=frozenset(
            context.used_team_ids
        ),
        log_score=0.0,
    )

    beam: list[SearchState] = [initial_state]

    expanded_state_count = 0
    rejected_reuse_count = 0
    rejected_holiday_count = 0
    retained_by_leg: list[dict[str, int]] = []

    for leg_number, leg_id in leg_order:
        leg_candidates = grouped.get(leg_id, [])

        if not leg_candidates:
            raise PathOptimizerError(
                f"No candidates exist for contest leg {leg_id}."
            )

        expanded: list[SearchState] = []

        for state in beam:
            for candidate in leg_candidates:
                expanded_state_count += 1

                if candidate.team_id in state.used_team_ids:
                    rejected_reuse_count += 1
                    continue

                proposed_path = (
                    *state.path,
                    candidate,
                )

                holiday_check = path_preserves_circa_holidays(
                    context,
                    all_candidates,
                    proposed_path,
                )

                if not holiday_check.feasible:
                    rejected_holiday_count += 1
                    continue

                probability = candidate_probability(
                    candidate
                )

                new_state = SearchState(
                    path=proposed_path,
                    used_team_ids=(
                        state.used_team_ids
                        | {candidate.team_id}
                    ),
                    log_score=(
                        state.log_score
                        + __import__("math").log(
                            probability
                        )
                    ),
                )

                expanded.append(new_state)

        if not expanded:
            raise PathOptimizerError(
                "Dynamic Programming could not produce a valid "
                f"state for contest leg {leg_id}."
            )

        beam = prune_duplicate_states(expanded)

        retained_by_leg.append({
            "leg_number": leg_number,
            "contest_leg_id": leg_id,
            "expanded_states": len(expanded),
            "retained_states": len(beam),
        })

    beam.sort(key=search_state_sort_key)
    best_state = beam[0]

    diagnostics = {
        "method": "BEAM_SEARCH_DYNAMIC_PROGRAMMING",
        "beam_width": BEAM_WIDTH,
        "candidates_per_leg": CANDIDATES_PER_LEG,
        "expanded_state_count": expanded_state_count,
        "rejected_reuse_count": rejected_reuse_count,
        "rejected_holiday_count": rejected_holiday_count,
        "final_state_count": len(beam),
        "retained_by_leg": retained_by_leg,
    }

    return list(best_state.path), diagnostics


def build_rationale(
    candidate: StrategyCandidate,
) -> str:
    """Generate deterministic backend rationale."""
    adjusted_pct = candidate_probability(candidate) * 100

    explanation = (
        "Selected by beam-search dynamic programming as part of "
        "the strongest retained remaining-season path. "
        f"Risk-adjusted win probability is {adjusted_pct:.2f}%."
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

    if candidate.is_special_leg:
        explanation += (
            f" This selection satisfies the "
            f"{candidate.special_leg_type} CIRCA leg."
        )

    return explanation


def candidate_to_pick(
    candidate: StrategyCandidate,
    *,
    rank: int | None = None,
) -> dict[str, Any]:
    """Convert one optimized candidate into response form."""
    projected_line = None

    if candidate.candidate_projected_spread is not None:
        projected_line = (
            f"{candidate.team_abbr} "
            f"{float(candidate.candidate_projected_spread):.1f}"
        )

    return {
        "rank": rank,
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
        "probability_model": candidate.probability_model,
        "projection_model": candidate.projection_model,
        "risk_model": candidate.risk_model,
        "rationale": build_rationale(candidate),
    }


def rank_current_leg_candidates(
    *,
    context: StrategyContext,
    candidates: list[StrategyCandidate],
) -> list[StrategyCandidate]:
    """
    Produce a current-leg board for alternatives.

    This ranking is informational and does not replace the optimized
    season-path selection.
    """
    current = [
        candidate
        for candidate in candidates
        if candidate.contest_leg_id
        == context.current_contest_leg_id
        and candidate.eligible
        and not candidate.already_used
    ]

    current.sort(
        key=lambda candidate: (
            -candidate_probability(candidate),
            -float(candidate.baseline_wp),
            candidate.team_abbr,
        )
    )

    return current


def run_for_entry(
    *,
    args: argparse.Namespace,
    entry_id: int,
) -> dict[str, Any]:
    """Run Dynamic Programming V2 for one entry."""
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

    optimized_path, diagnostics = optimize_path(
        context=context,
        all_candidates=candidates,
    )

    required_leg_ids = expected_remaining_leg_ids(
        context,
        candidates,
    )

    metrics = evaluate_path(
        context,
        optimized_path,
        required_leg_ids=required_leg_ids,
    )

    if not metrics.is_valid:
        raise PathOptimizerError(
            "Dynamic Programming path failed validation: "
            + "; ".join(metrics.validation_errors)
        )

    picks = [
        candidate_to_pick(candidate)
        for candidate in optimized_path
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

    ranked_current = rank_current_leg_candidates(
        context=context,
        candidates=candidates,
    )

    selected_current_team_id = (
        primary["team_id"]
        if primary is not None
        else None
    )

    alternative_candidates = [
        candidate
        for candidate in ranked_current
        if candidate.team_id
        != selected_current_team_id
    ][:2]

    alternatives = [
        candidate_to_pick(
            candidate,
            rank=rank,
        )
        for rank, candidate in enumerate(
            alternative_candidates,
            start=2,
        )
    ]

    holiday_selections = [
        pick
        for pick in picks
        if pick["is_special_leg"]
    ]

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
        "holiday_selections": holiday_selections,
        "path_metrics": metrics.to_dict(),
        "estimated_path_survival_probability": (
            metrics.estimated_path_survival_probability
        ),
        "conditional_survival_probability": (
            metrics.conditional_survival_probability
        ),
        "optimization_diagnostics": diagnostics,
    }


def run_strategy(args: argparse.Namespace) -> dict[str, Any]:
    entry_ids = load_active_entry_ids(args.entry_id)

    entries = [
        run_for_entry(
            args=args,
            entry_id=entry_id,
        )
        for entry_id in entry_ids
    ]

    return {
        "strategy": STRATEGY_CODE,
        "strategy_version": STRATEGY_VERSION,
        "strategy_type": "REFERENCE_OPTIMIZER",
        "objective": (
            "Maximize the sum of log canonical risk-adjusted "
            "win probabilities subject to survivor and CIRCA "
            "constraints."
        ),
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "optimization_method": (
            "BEAM_SEARCH_DYNAMIC_PROGRAMMING"
        ),
        "beam_width": BEAM_WIDTH,
        "candidates_per_leg": CANDIDATES_PER_LEG,
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
