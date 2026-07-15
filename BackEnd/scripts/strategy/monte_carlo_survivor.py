#!/usr/bin/env python3
"""
SemiSharp Monte Carlo Survivor Strategy V2

Purpose
-------
Generate multiple legal remaining-season paths, simulate uncertain game
outcomes for each path, and return the path with the strongest simulated
survivor performance.

Canonical Probability
---------------------
Every simulation begins with:

    analytics.game_win_probabilities.risk_adjusted_wp

Monte Carlo does not recreate win probabilities from projected spreads.

Simulation Model
----------------
For each candidate pick:

1. Treat risk_adjusted_wp as the expected win probability.
2. Draw a simulated true probability from a Beta distribution.
3. Increase uncertainty when the candidate has a larger risk discount.
4. Simulate a Bernoulli win/loss outcome.
5. Stop the simulated season at the first loss.

Candidate paths are generated through randomized, probability-weighted
greedy search. All paths must satisfy survivor rules.

Metrics
-------
Each candidate path is ranked by:

1. Simulated full-path survival rate.
2. Expected number of contest legs survived.
3. Median elimination leg.
4. Canonical path survival probability.
5. Deterministic team-sequence tie breaker.

CIRCA Rules
-----------
Thanksgiving and Christmas are separate contest legs.

Every generated path must:

- include both remaining holiday legs
- use distinct teams
- preserve holiday feasibility during path construction
- exclude previously used teams

Reproducibility
---------------
A deterministic random seed is derived from:

- season
- entry ID
- contest format
- strategy version

Identical inputs therefore reproduce identical results.

Output
------
The response includes:

- best simulated season path
- simulated survival rate
- expected finish
- median elimination leg
- elimination distribution
- canonical path probability
- primary current-leg recommendation
- current-leg alternatives
- holiday selections
- simulation diagnostics
- active model versions

Limitations
-----------
This is a research simulation, not a guarantee of contest performance.

Game independence and Beta-distributed probability uncertainty are
simplifying assumptions.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from dataclasses import dataclass
from decimal import Decimal
from statistics import median
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


STRATEGY_CODE = "MONTE_CARLO_SURVIVOR"
STRATEGY_VERSION = "2.0"

# Runtime controls.
CANDIDATE_PATH_COUNT = 200
SIMULATIONS_PER_PATH = 2000
PATH_CANDIDATES_PER_LEG = 10

# Beta concentration controls probability uncertainty.
# Larger concentration means lower variance.
BASE_BETA_CONCENTRATION = 100.0
MIN_BETA_CONCENTRATION = 20.0


@dataclass(frozen=True, slots=True)
class SimulationMetrics:
    """Monte Carlo results for one complete survivor path."""

    survival_rate: float
    expected_legs_survived: float
    median_elimination_leg: float
    canonical_path_probability: float
    elimination_counts: tuple[tuple[str, int], ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "survival_rate": self.survival_rate,
            "expected_legs_survived": (
                self.expected_legs_survived
            ),
            "median_elimination_leg": (
                self.median_elimination_leg
            ),
            "canonical_path_probability": (
                self.canonical_path_probability
            ),
            "elimination_counts": {
                key: value
                for key, value in self.elimination_counts
            },
        }


@dataclass(frozen=True, slots=True)
class SimulatedPath:
    """One legal candidate path and its simulation results."""

    path: tuple[StrategyCandidate, ...]
    metrics: SimulationMetrics


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate and simulate survivor paths using canonical "
            "risk-adjusted win probabilities."
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

    # Optional during migration. Without entry ID, run all active entries.
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


def deterministic_seed(
    context: StrategyContext,
) -> int:
    """Create a stable random seed for reproducible simulation."""
    source = (
        f"{context.season}|{context.entry_id}|"
        f"{context.contest_format}|{STRATEGY_VERSION}"
    )

    digest = hashlib.sha256(
        source.encode("utf-8")
    ).hexdigest()

    return int(digest[:16], 16)


def group_candidates_by_leg(
    candidates: list[StrategyCandidate],
) -> dict[int, list[StrategyCandidate]]:
    """Group eligible candidates by contest leg."""
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
            key=lambda item: (
                -candidate_probability(item),
                -float(item.baseline_wp),
                item.team_abbr,
            )
        )

        grouped[leg_id] = leg_candidates[
            :PATH_CANDIDATES_PER_LEG
        ]

    return grouped


def weighted_candidate_choice(
    rng: random.Random,
    candidates: list[StrategyCandidate],
) -> StrategyCandidate:
    """
    Select a candidate probabilistically.

    Higher adjusted win probability receives more weight, but lower-ranked
    candidates remain available so Monte Carlo explores diverse paths.
    """
    weights = [
        candidate_probability(candidate) ** 8
        for candidate in candidates
    ]

    total = sum(weights)

    if total <= 0:
        return candidates[0]

    threshold = rng.random() * total
    running = 0.0

    for candidate, weight in zip(
        candidates,
        weights,
    ):
        running += weight

        if running >= threshold:
            return candidate

    return candidates[-1]


def generate_random_path(
    *,
    context: StrategyContext,
    all_candidates: list[StrategyCandidate],
    grouped: dict[int, list[StrategyCandidate]],
    rng: random.Random,
) -> list[StrategyCandidate] | None:
    """Generate one legal randomized remaining-season path."""
    leg_order = sorted({
        (
            candidate.leg_number,
            candidate.contest_leg_id,
        )
        for candidate in all_candidates
    })

    selected_path: list[StrategyCandidate] = []
    selected_team_ids = set(context.used_team_ids)
    enforce_holiday_feasibility = (
        context.contest_format == "CIRCA"
    )

    for _, leg_id in leg_order:
        leg_candidates = grouped.get(leg_id, [])

        valid: list[StrategyCandidate] = []

        for candidate in leg_candidates:
            if candidate.team_id in selected_team_ids:
                continue

            proposed_path = [
                *selected_path,
                candidate,
            ]

            if enforce_holiday_feasibility:
                holiday = path_preserves_circa_holidays(
                    context,
                    all_candidates,
                    proposed_path,
                )

                if not holiday.feasible:
                    continue

            valid.append(candidate)

        if not valid:
            return None

        selected = weighted_candidate_choice(
            rng,
            valid,
        )

        selected_path.append(selected)
        selected_team_ids.add(selected.team_id)

    return selected_path


def generate_candidate_paths(
    *,
    context: StrategyContext,
    candidates: list[StrategyCandidate],
    rng: random.Random,
) -> list[list[StrategyCandidate]]:
    """
    Generate distinct legal randomized paths.

    Duplicate team sequences are discarded.
    """
    grouped = group_candidates_by_leg(candidates)

    required_leg_ids = expected_remaining_leg_ids(
        context,
        candidates,
    )

    unique_paths: dict[
        tuple[int, ...],
        list[StrategyCandidate],
    ] = {}

    max_attempts = CANDIDATE_PATH_COUNT * 20

    for _ in range(max_attempts):
        path = generate_random_path(
            context=context,
            all_candidates=candidates,
            grouped=grouped,
            rng=rng,
        )

        if path is None:
            continue

        metrics = evaluate_path(
            context,
            path,
            required_leg_ids=required_leg_ids,
        )

        if not metrics.is_valid:
            continue

        key = tuple(
            candidate.team_id
            for candidate in path
        )

        unique_paths.setdefault(key, path)

        if len(unique_paths) >= CANDIDATE_PATH_COUNT:
            break

    if not unique_paths:
        raise PathOptimizerError(
            "Monte Carlo could not generate a valid candidate path."
        )

    return list(unique_paths.values())


def beta_concentration(
    candidate: StrategyCandidate,
) -> float:
    """
    Convert candidate risk into Beta-distribution concentration.

    Larger risk discounts create wider probability distributions.
    """
    discount = float(
        candidate.risk_discount_factor or 0.0
    )

    concentration = (
        BASE_BETA_CONCENTRATION
        * (1.0 - min(max(discount, 0.0), 0.50))
    )

    return max(
        concentration,
        MIN_BETA_CONCENTRATION,
    )


def uncertain_probability(
    rng: random.Random,
    candidate: StrategyCandidate,
) -> float:
    """Draw one uncertain true probability around the canonical mean."""
    mean_probability = candidate_probability(
        candidate
    )

    concentration = beta_concentration(
        candidate
    )

    alpha = max(
        mean_probability * concentration,
        0.001,
    )

    beta = max(
        (1.0 - mean_probability) * concentration,
        0.001,
    )

    return rng.betavariate(
        alpha,
        beta,
    )


def simulate_path(
    *,
    path: list[StrategyCandidate],
    rng: random.Random,
) -> SimulationMetrics:
    """Run repeated uncertain-outcome simulations for one path."""
    survived_all = 0
    total_legs_survived = 0
    elimination_legs: list[int] = []
    elimination_counts: dict[str, int] = {}

    prepared: list[
        tuple[int, str, float, float, float]
    ] = []

    for candidate in path:
        mean_probability = candidate_probability(
            candidate
        )
        concentration = beta_concentration(
            candidate
        )
        alpha = max(
            mean_probability * concentration,
            0.001,
        )
        beta = max(
            (1.0 - mean_probability) * concentration,
            0.001,
        )
        prepared.append(
            (
                candidate.leg_number,
                candidate.leg_code,
                mean_probability,
                alpha,
                beta,
            )
        )

    canonical_probability = math.prod(
        item[2]
        for item in prepared
    )

    betavariate = rng.betavariate
    random_value = rng.random

    for _ in range(SIMULATIONS_PER_PATH):
        legs_survived = 0
        eliminated = False

        for leg_number, leg_code, _, alpha, beta in prepared:
            true_probability = betavariate(
                alpha,
                beta,
            )

            if random_value() <= true_probability:
                legs_survived += 1
                continue

            eliminated = True
            elimination_legs.append(
                leg_number
            )

            key = leg_code
            elimination_counts[key] = (
                elimination_counts.get(key, 0) + 1
            )

            break

        if not eliminated:
            survived_all += 1
            elimination_legs.append(
                len(path) + 1
            )
            elimination_counts["SURVIVED_PATH"] = (
                elimination_counts.get(
                    "SURVIVED_PATH",
                    0,
                )
                + 1
            )

        total_legs_survived += legs_survived

    survival_rate = (
        survived_all / SIMULATIONS_PER_PATH
    )

    expected_legs_survived = (
        total_legs_survived
        / SIMULATIONS_PER_PATH
    )

    median_elimination = float(
        median(elimination_legs)
    )

    return SimulationMetrics(
        survival_rate=survival_rate,
        expected_legs_survived=expected_legs_survived,
        median_elimination_leg=median_elimination,
        canonical_path_probability=canonical_probability,
        elimination_counts=tuple(
            sorted(elimination_counts.items())
        ),
    )


def simulated_path_sort_key(
    result: SimulatedPath,
) -> tuple[Any, ...]:
    """Rank simulated paths deterministically."""
    return (
        -result.metrics.survival_rate,
        -result.metrics.expected_legs_survived,
        -result.metrics.median_elimination_leg,
        -result.metrics.canonical_path_probability,
        tuple(
            candidate.team_abbr
            for candidate in result.path
        ),
    )


def build_rationale(
    candidate: StrategyCandidate,
) -> str:
    """Generate deterministic backend rationale."""
    adjusted_pct = (
        candidate_probability(candidate) * 100
    )

    explanation = (
        "Selected as part of the strongest Monte Carlo path after "
        "simulating probability uncertainty and weekly elimination. "
        f"Canonical risk-adjusted win probability is "
        f"{adjusted_pct:.2f}%."
    )

    if candidate.risk_discount_factor is not None:
        explanation += (
            " Probability uncertainty used a risk discount of "
            f"{float(candidate.risk_discount_factor):.4f}."
        )

    if candidate.is_special_leg:
        explanation += (
            f" This pick satisfies the "
            f"{candidate.special_leg_type} CIRCA leg."
        )

    return explanation


def candidate_to_pick(
    candidate: StrategyCandidate,
    *,
    rank: int | None = None,
) -> dict[str, Any]:
    """Convert one simulated-path candidate into response form."""
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
        "adjusted_probability": decimal_to_float(
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
        "rationale": build_rationale(candidate),
    }


def rank_current_leg_candidates(
    *,
    context: StrategyContext,
    candidates: list[StrategyCandidate],
) -> list[StrategyCandidate]:
    """Return the canonical current-leg board."""
    current = [
        candidate
        for candidate in candidates
        if candidate.contest_leg_id
        == context.current_contest_leg_id
        and candidate.eligible
        and not candidate.already_used
    ]

    current.sort(
        key=lambda item: (
            -candidate_probability(item),
            -float(item.baseline_wp),
            item.team_abbr,
        )
    )

    return current


def run_for_entry(
    *,
    args: argparse.Namespace,
    entry_id: int,
) -> dict[str, Any]:
    """Run Monte Carlo Survivor V2 for one entry."""
    context = build_strategy_context(
        entry_id=entry_id,
        contest_format=args.contest_format,
    )

    validate_request_against_context(
        args,
        context,
    )

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

    seed = deterministic_seed(context)
    rng = random.Random(seed)

    candidate_paths = generate_candidate_paths(
        context=context,
        candidates=candidates,
        rng=rng,
    )

    simulated_results = [
        SimulatedPath(
            path=tuple(path),
            metrics=simulate_path(
                path=path,
                rng=rng,
            ),
        )
        for path in candidate_paths
    ]

    simulated_results.sort(
        key=simulated_path_sort_key
    )

    best_result = simulated_results[0]
    best_path = list(best_result.path)

    required_leg_ids = expected_remaining_leg_ids(
        context,
        candidates,
    )

    path_metrics = evaluate_path(
        context,
        best_path,
        required_leg_ids=required_leg_ids,
    )

    if not path_metrics.is_valid:
        raise PathOptimizerError(
            "Monte Carlo selected path failed validation: "
            + "; ".join(path_metrics.validation_errors)
        )

    picks = [
        candidate_to_pick(candidate)
        for candidate in best_path
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

    current_ranked = rank_current_leg_candidates(
        context=context,
        candidates=candidates,
    )

    selected_current_team_id = (
        primary["team_id"]
        if primary is not None
        else None
    )

    alternatives = [
        candidate_to_pick(
            candidate,
            rank=rank,
        )
        for rank, candidate in enumerate(
            [
                candidate
                for candidate in current_ranked
                if candidate.team_id
                != selected_current_team_id
            ][:2],
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
        "path_metrics": path_metrics.to_dict(),
        "estimated_path_survival_probability": (
            path_metrics.estimated_path_survival_probability
        ),
        "conditional_survival_probability": (
            path_metrics.conditional_survival_probability
        ),
        "simulation_metrics": (
            best_result.metrics.to_dict()
        ),
        "simulation_diagnostics": {
            "random_seed": seed,
            "candidate_paths_requested": (
                CANDIDATE_PATH_COUNT
            ),
            "candidate_paths_generated": len(
                candidate_paths
            ),
            "simulations_per_path": (
                SIMULATIONS_PER_PATH
            ),
            "total_simulated_seasons": (
                len(candidate_paths)
                * SIMULATIONS_PER_PATH
            ),
            "path_candidates_per_leg": (
                PATH_CANDIDATES_PER_LEG
            ),
            "beta_base_concentration": (
                BASE_BETA_CONCENTRATION
            ),
        },
    }


def run_strategy(
    args: argparse.Namespace,
) -> dict[str, Any]:
    entry_ids = load_active_entry_ids(
        args.entry_id
    )

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
        "strategy_type": "SIMULATION_OPTIMIZER",
        "objective": (
            "Maximize simulated survivor performance under "
            "canonical probability uncertainty."
        ),
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "method": (
            "BETA_UNCERTAINTY_MONTE_CARLO"
        ),
        "candidate_path_count": CANDIDATE_PATH_COUNT,
        "simulations_per_path": (
            SIMULATIONS_PER_PATH
        ),
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
