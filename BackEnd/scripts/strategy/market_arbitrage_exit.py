#!/usr/bin/env python3
"""
SemiSharp Market Arbitrage Exit Strategy V2

Purpose
-------
Build the safest survivor path through NFL Week 10 under the assumption
that the entry will be sold or transferred after that point.

This strategy intentionally does not preserve teams for Weeks 11-18.

Canonical Probability
---------------------
Every selection is based on:

    analytics.game_win_probabilities.risk_adjusted_wp

No independent probability or risk-adjusted spread is calculated here.

Planning Horizon
----------------
The strategy includes only contest legs whose NFL week is between the
active week and NFL Week 10, inclusive.

It returns no picks after Week 10.

Objective
---------
Maximize short-horizon survival by selecting the highest available
risk-adjusted win probability for each remaining leg through Week 10.

Rules
-----
1. Start at the active contest leg.
2. Stop after NFL Week 10.
3. Do not reuse a team.
4. Exclude teams already used by the selected entry.
5. Rank candidates by risk_adjusted_wp descending.
6. Use deterministic tie-breaking.
7. Do not preserve teams for weeks outside the exit horizon.

CIRCA Rules
-----------
Only CIRCA special legs falling within the Week 10 horizon constrain the
path.

Thanksgiving and Christmas normally occur after Week 10 and therefore do
not constrain this exit strategy.

If a future contest configuration places a special leg inside the
horizon, that leg is included and must receive a valid distinct team.

Output
------
The response includes:

- one path per active survivor entry
- picks only through NFL Week 10
- primary current-leg recommendation
- current-leg alternatives
- horizon survival probability
- conditional horizon survival probability
- backend rationale
- active model versions

Limitations
-----------
The strategy optimizes survival through the exit horizon only.

It is not intended for entries that will remain active for the full
season.
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
    PathOptimizerError,
    candidate_probability,
    evaluate_path,
)
from app.services.strategy_context_service import (
    StrategyContext,
    StrategyContextError,
    build_strategy_context,
)


STRATEGY_CODE = "MARKET_ARBITRAGE_EXIT"
STRATEGY_VERSION = "2.0"
EXIT_NFL_WEEK = 10


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate the safest survivor path through NFL Week 10."
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

    # Optional during migration. The current API runs all active entries.
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
    """Return the requested entry or every active entry."""
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


def candidate_is_within_horizon(
    candidate: StrategyCandidate,
) -> bool:
    """
    Include regular or special contest legs only when their mapped NFL
    week is no later than the Week 10 exit horizon.
    """
    return (
        candidate.nfl_week is not None
        and candidate.nfl_week <= EXIT_NFL_WEEK
    )


def filter_horizon_candidates(
    candidates: list[StrategyCandidate],
) -> list[StrategyCandidate]:
    """Return eligible candidates inside the active exit horizon."""
    filtered = [
        candidate
        for candidate in candidates
        if candidate_is_within_horizon(candidate)
        and candidate.eligible
        and not candidate.already_used
    ]

    if not filtered:
        raise PathOptimizerError(
            "No eligible candidates exist inside the Week 10 "
            "exit horizon."
        )

    return filtered


def group_candidates_by_leg(
    candidates: list[StrategyCandidate],
) -> dict[int, list[StrategyCandidate]]:
    """Group candidates by contest leg with deterministic ordering."""
    grouped: dict[int, list[StrategyCandidate]] = {}

    for candidate in candidates:
        grouped.setdefault(
            candidate.contest_leg_id,
            [],
        ).append(candidate)

    for leg_candidates in grouped.values():
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

    return grouped


def build_rationale(
    candidate: StrategyCandidate,
    *,
    rank: int | None = None,
) -> str:
    """Generate deterministic backend rationale."""
    adjusted_pct = candidate_probability(candidate) * 100

    prefix = (
        f"Ranked #{rank}. "
        if rank is not None
        else ""
    )

    explanation = (
        f"{prefix}Selected to maximize survival through the "
        f"Week {EXIT_NFL_WEEK} exit horizon. "
        f"Risk-adjusted win probability is "
        f"{adjusted_pct:.2f}%."
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

    explanation += (
        " No team value is reserved for games after the exit horizon."
    )

    return explanation


def candidate_to_pick(
    candidate: StrategyCandidate,
    *,
    rank: int | None = None,
) -> dict[str, Any]:
    """Convert one canonical candidate into the response schema."""
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
        "mode": "ARBITRAGE_MAX_SURVIVAL",
        "exit_horizon_week": EXIT_NFL_WEEK,
        "rationale": build_rationale(
            candidate,
            rank=rank,
        ),
    }


def construct_exit_path(
    *,
    context: StrategyContext,
    candidates: list[StrategyCandidate],
) -> tuple[
    list[StrategyCandidate],
    list[StrategyCandidate],
]:
    """
    Build one deterministic path through the Week 10 exit horizon.

    Returns:

    1. selected path
    2. ranked active-leg candidates
    """
    grouped = group_candidates_by_leg(candidates)

    leg_order = sorted({
        (
            candidate.leg_number,
            candidate.contest_leg_id,
            candidate.nfl_week,
        )
        for candidate in candidates
    })

    selected_path: list[StrategyCandidate] = []
    selected_team_ids = set(context.used_team_ids)
    current_leg_ranked: list[StrategyCandidate] = []

    for _, leg_id, _ in leg_order:
        leg_candidates = grouped.get(leg_id, [])

        valid_candidates = [
            candidate
            for candidate in leg_candidates
            if candidate.team_id not in selected_team_ids
            and candidate.eligible
            and not candidate.already_used
        ]

        if not valid_candidates:
            raise PathOptimizerError(
                "No eligible Market Arbitrage Exit candidate "
                f"remains for contest leg {leg_id}."
            )

        valid_candidates.sort(
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

        if leg_id == context.current_contest_leg_id:
            current_leg_ranked = list(valid_candidates)

        selected = valid_candidates[0]

        selected_path.append(selected)
        selected_team_ids.add(selected.team_id)

    return selected_path, current_leg_ranked


def run_for_entry(
    *,
    args: argparse.Namespace,
    entry_id: int,
) -> dict[str, Any]:
    """Run Market Arbitrage Exit V2 for one survivor entry."""
    context = build_strategy_context(
        entry_id=entry_id,
        contest_format=args.contest_format,
    )

    validate_request_against_context(args, context)

    all_candidates = build_candidate_matrix(
        context,
        include_ineligible=False,
    )

    horizon_candidates = filter_horizon_candidates(
        all_candidates
    )

    selected_path, current_leg_ranked = (
        construct_exit_path(
            context=context,
            candidates=horizon_candidates,
        )
    )

    required_leg_ids = tuple(
        leg_id
        for _, leg_id in sorted({
            (
                candidate.leg_number,
                candidate.contest_leg_id,
            )
            for candidate in horizon_candidates
        })
    )

    metrics = evaluate_path(
        context,
        selected_path,
        required_leg_ids=required_leg_ids,
    )

    if not metrics.is_valid:
        raise PathOptimizerError(
            "Generated Market Arbitrage Exit path failed "
            "validation: "
            + "; ".join(metrics.validation_errors)
        )

    picks = [
        candidate_to_pick(candidate)
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
            rank=rank,
        )
        for rank, candidate in enumerate(
            current_leg_ranked[1:3],
            start=2,
        )
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
        "path_metrics": metrics.to_dict(),
        "estimated_path_survival_probability": (
            metrics.estimated_path_survival_probability
        ),
        "conditional_survival_probability": (
            metrics.conditional_survival_probability
        ),
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
        "strategy_type": "EXIT_HORIZON_PATH",
        "objective": (
            "Maximize survivor probability through NFL Week 10 "
            "without preserving teams for later weeks."
        ),
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "target_horizon": (
            "NFL Week 10 Marketplace Exit"
        ),
        "exit_horizon_week": EXIT_NFL_WEEK,
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
