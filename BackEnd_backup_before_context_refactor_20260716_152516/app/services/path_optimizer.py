from __future__ import annotations

"""
Shared survivor path optimization utilities.

Purpose
-------
Provide reusable probability calculations, path validation, deterministic
comparison, and CIRCA holiday-feasibility checks for all season-planning
strategies.

This module contains no database access and no strategy-specific policy.
It operates only on canonical StrategyCandidate objects produced by the
Candidate Builder.

Used By
-------
- Future Value
- Bottom Six Road Fade
- Market Arbitrage Exit
- Dynamic Programming
- Monte Carlo Survivor
- Compare Strategies

Core Rules
----------
1. Every path uses risk_adjusted_wp as its survival probability.
2. A team may appear no more than once in a survivor path.
3. A contest leg may receive no more than one selection.
4. Path probability is the product of individual pick probabilities.
5. Optimization uses sum(log(probability)) for numerical stability.
6. CIRCA paths must preserve feasible Thanksgiving and Christmas picks.
7. Missing or invalid probabilities are rejected rather than invented.
"""

import math
from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, Sequence

from app.services.candidate_builder import StrategyCandidate
from app.services.strategy_context_service import StrategyContext


MINIMUM_PROBABILITY = 1e-12
MAXIMUM_PROBABILITY = 1.0


class PathOptimizerError(ValueError):
    """Raised when a survivor path or candidate set is invalid."""


@dataclass(frozen=True, slots=True)
class PathMetrics:
    """
    Shared probability and validation results for one survivor path.
    """

    pick_count: int
    path_log_score: float
    estimated_path_survival_probability: float
    conditional_survival_probability: float
    unique_team_count: int
    unique_leg_count: int
    is_complete: bool
    is_valid: bool
    validation_errors: tuple[str, ...]

    def to_dict(self) -> dict:
        return {
            "pick_count": self.pick_count,
            "path_log_score": self.path_log_score,
            "estimated_path_survival_probability": (
                self.estimated_path_survival_probability
            ),
            "conditional_survival_probability": (
                self.conditional_survival_probability
            ),
            "unique_team_count": self.unique_team_count,
            "unique_leg_count": self.unique_leg_count,
            "is_complete": self.is_complete,
            "is_valid": self.is_valid,
            "validation_errors": list(self.validation_errors),
        }


@dataclass(frozen=True, slots=True)
class HolidayFeasibility:
    """
    Result of checking whether all remaining CIRCA holiday legs can receive
    distinct, unused teams.
    """

    feasible: bool
    required_holiday_leg_ids: tuple[int, ...]
    available_team_ids_by_leg: dict[int, tuple[int, ...]]
    reserved_team_ids: tuple[int, ...]
    reason: str | None

    def to_dict(self) -> dict:
        return {
            "feasible": self.feasible,
            "required_holiday_leg_ids": list(
                self.required_holiday_leg_ids
            ),
            "available_team_ids_by_leg": {
                str(leg_id): list(team_ids)
                for leg_id, team_ids
                in self.available_team_ids_by_leg.items()
            },
            "reserved_team_ids": list(self.reserved_team_ids),
            "reason": self.reason,
        }


def probability_as_float(
    probability: Decimal | float | int,
) -> float:
    """
    Convert and validate a probability.

    Probabilities must be greater than zero and no greater than one.
    The backend must not silently substitute a probability for missing or
    invalid analytical data.
    """
    value = float(probability)

    if not math.isfinite(value):
        raise PathOptimizerError(
            f"Probability is not finite: {value}"
        )

    if value <= 0.0 or value > MAXIMUM_PROBABILITY:
        raise PathOptimizerError(
            "Probability must be greater than 0 and no greater "
            f"than 1. Received: {value}"
        )

    return max(value, MINIMUM_PROBABILITY)


def candidate_probability(
    candidate: StrategyCandidate,
) -> float:
    """
    Return the canonical survival probability for one candidate.
    """
    if candidate.risk_adjusted_wp is None:
        raise PathOptimizerError(
            f"Candidate {candidate.team_abbr} for "
            f"{candidate.leg_code} has no risk-adjusted probability."
        )

    return probability_as_float(
        candidate.risk_adjusted_wp
    )


def path_log_probability(
    path: Sequence[StrategyCandidate],
) -> float:
    """
    Calculate sum(log(risk_adjusted_wp)).

    Log scoring is the preferred optimization representation because
    multiplying many small probabilities can create numerical underflow.
    """
    return sum(
        math.log(candidate_probability(candidate))
        for candidate in path
    )


def path_survival_probability(
    path: Sequence[StrategyCandidate],
) -> float:
    """
    Calculate the probability of surviving every selection in the path.

    Assuming game outcomes are treated as independent for this estimate:

        P(path) = P1 × P2 × ... × Pn

    This is an estimate, not a guarantee. Correlation and model uncertainty
    may be handled by Monte Carlo or later model versions.
    """
    if not path:
        return 1.0

    return math.exp(path_log_probability(path))


def conditional_survival_probability(
    path: Sequence[StrategyCandidate],
    *,
    starting_leg_number: int,
) -> float:
    """
    Calculate survival probability from a selected contest leg onward.

    Completed legs are excluded. This allows the estimate to improve
    naturally as an entry survives deeper into the season.
    """
    remaining = [
        candidate
        for candidate in path
        if candidate.leg_number >= starting_leg_number
    ]

    return path_survival_probability(remaining)


def validate_unique_teams(
    path: Sequence[StrategyCandidate],
) -> list[str]:
    """Return validation errors for repeated teams."""
    team_ids = [
        candidate.team_id
        for candidate in path
    ]

    duplicates = sorted({
        team_id
        for team_id in team_ids
        if team_ids.count(team_id) > 1
    })

    if not duplicates:
        return []

    return [
        "Path reuses team IDs: "
        + ", ".join(str(team_id) for team_id in duplicates)
    ]


def validate_unique_legs(
    path: Sequence[StrategyCandidate],
) -> list[str]:
    """Return validation errors for duplicate contest-leg selections."""
    leg_ids = [
        candidate.contest_leg_id
        for candidate in path
    ]

    duplicates = sorted({
        leg_id
        for leg_id in leg_ids
        if leg_ids.count(leg_id) > 1
    })

    if not duplicates:
        return []

    return [
        "Path contains multiple picks for contest leg IDs: "
        + ", ".join(str(leg_id) for leg_id in duplicates)
    ]


def validate_candidate_eligibility(
    path: Sequence[StrategyCandidate],
) -> list[str]:
    """Return validation errors for ineligible path selections."""
    invalid = [
        f"{candidate.leg_code}:{candidate.team_abbr}"
        for candidate in path
        if not candidate.eligible or candidate.already_used
    ]

    if not invalid:
        return []

    return [
        "Path contains ineligible selections: "
        + ", ".join(invalid)
    ]


def validate_path_order(
    path: Sequence[StrategyCandidate],
) -> list[str]:
    """Require path selections to be ordered by contest-leg number."""
    leg_numbers = [
        candidate.leg_number
        for candidate in path
    ]

    if leg_numbers == sorted(leg_numbers):
        return []

    return [
        "Path selections are not ordered by contest-leg number."
    ]


def expected_remaining_leg_ids(
    context: StrategyContext,
    candidates: Iterable[StrategyCandidate],
    *,
    ending_leg_number: int | None = None,
) -> tuple[int, ...]:
    """
    Derive the remaining contest legs represented by the candidate matrix.
    """
    leg_pairs = {
        (
            candidate.leg_number,
            candidate.contest_leg_id,
        )
        for candidate in candidates
        if candidate.leg_number >= context.current_leg_number
        and (
            ending_leg_number is None
            or candidate.leg_number <= ending_leg_number
        )
    }

    return tuple(
        leg_id
        for _, leg_id in sorted(leg_pairs)
    )


def validate_path_completeness(
    path: Sequence[StrategyCandidate],
    required_leg_ids: Sequence[int],
) -> list[str]:
    """
    Confirm the path contains exactly one pick for every required leg.
    """
    selected_leg_ids = {
        candidate.contest_leg_id
        for candidate in path
    }

    required = set(required_leg_ids)

    missing = sorted(required - selected_leg_ids)
    unexpected = sorted(selected_leg_ids - required)

    errors: list[str] = []

    if missing:
        errors.append(
            "Path is missing contest leg IDs: "
            + ", ".join(str(leg_id) for leg_id in missing)
        )

    if unexpected:
        errors.append(
            "Path contains unexpected contest leg IDs: "
            + ", ".join(str(leg_id) for leg_id in unexpected)
        )

    return errors


def evaluate_path(
    context: StrategyContext,
    path: Sequence[StrategyCandidate],
    *,
    required_leg_ids: Sequence[int] | None = None,
) -> PathMetrics:
    """
    Calculate shared path metrics and validation results.
    """
    errors: list[str] = []

    errors.extend(validate_unique_teams(path))
    errors.extend(validate_unique_legs(path))
    errors.extend(validate_candidate_eligibility(path))
    errors.extend(validate_path_order(path))

    is_complete = True

    if required_leg_ids is not None:
        completeness_errors = validate_path_completeness(
            path,
            required_leg_ids,
        )
        errors.extend(completeness_errors)
        is_complete = not completeness_errors

    try:
        log_score = path_log_probability(path)
        full_probability = path_survival_probability(path)
        conditional_probability = (
            conditional_survival_probability(
                path,
                starting_leg_number=context.current_leg_number,
            )
        )
    except PathOptimizerError as exc:
        errors.append(str(exc))
        log_score = float("-inf")
        full_probability = 0.0
        conditional_probability = 0.0

    team_count = len({
        candidate.team_id
        for candidate in path
    })

    leg_count = len({
        candidate.contest_leg_id
        for candidate in path
    })

    return PathMetrics(
        pick_count=len(path),
        path_log_score=log_score,
        estimated_path_survival_probability=(
            full_probability
        ),
        conditional_survival_probability=(
            conditional_probability
        ),
        unique_team_count=team_count,
        unique_leg_count=leg_count,
        is_complete=is_complete,
        is_valid=len(errors) == 0,
        validation_errors=tuple(errors),
    )


def _find_distinct_holiday_assignment(
    leg_ids: Sequence[int],
    available_team_ids_by_leg: dict[int, tuple[int, ...]],
    unavailable_team_ids: set[int],
) -> tuple[int, ...] | None:
    """
    Find one distinct-team assignment across holiday legs.

    The number of special CIRCA legs is small, so deterministic
    backtracking is clearer and cheaper than introducing a general-purpose
    optimization dependency.
    """

    ordered_leg_ids = sorted(
        leg_ids,
        key=lambda leg_id: (
            len(available_team_ids_by_leg.get(leg_id, ())),
            leg_id,
        ),
    )

    assignment: dict[int, int] = {}

    def search(index: int, used: set[int]) -> bool:
        if index >= len(ordered_leg_ids):
            return True

        leg_id = ordered_leg_ids[index]

        options = available_team_ids_by_leg.get(
            leg_id,
            (),
        )

        for team_id in options:
            if team_id in unavailable_team_ids:
                continue

            if team_id in used:
                continue

            assignment[leg_id] = team_id
            used.add(team_id)

            if search(index + 1, used):
                return True

            used.remove(team_id)
            del assignment[leg_id]

        return False

    if not search(0, set()):
        return None

    return tuple(
        assignment[leg_id]
        for leg_id in leg_ids
    )


def check_circa_holiday_feasibility(
    context: StrategyContext,
    candidates: Sequence[StrategyCandidate],
    *,
    additionally_unavailable_team_ids: Iterable[int] = (),
) -> HolidayFeasibility:
    """
    Determine whether all remaining CIRCA holiday legs can receive
    distinct, unused teams.

    STANDARD contests always return feasible because they have no separate
    holiday-leg reservation requirement.

    This function does not choose the final strategy path. It only proves
    whether a valid holiday assignment remains possible.
    """
    if context.contest_format != "CIRCA":
        return HolidayFeasibility(
            feasible=True,
            required_holiday_leg_ids=(),
            available_team_ids_by_leg={},
            reserved_team_ids=(),
            reason=None,
        )

    holiday_candidates = [
        candidate
        for candidate in candidates
        if candidate.is_special_leg
        and candidate.special_leg_type
        in {"THANKSGIVING", "CHRISTMAS"}
        and candidate.leg_number >= context.current_leg_number
        and candidate.eligible
        and not candidate.already_used
    ]

    required_leg_ids = tuple(sorted({
        candidate.contest_leg_id
        for candidate in holiday_candidates
    }))

    if not required_leg_ids:
        return HolidayFeasibility(
            feasible=True,
            required_holiday_leg_ids=(),
            available_team_ids_by_leg={},
            reserved_team_ids=(),
            reason=None,
        )

    available: dict[int, tuple[int, ...]] = {}

    for leg_id in required_leg_ids:
        leg_candidates = [
            candidate
            for candidate in holiday_candidates
            if candidate.contest_leg_id == leg_id
        ]

        # Prefer higher canonical probability, then stable team ID.
        ordered = sorted(
            leg_candidates,
            key=lambda candidate: (
                -candidate_probability(candidate),
                candidate.team_id,
            ),
        )

        available[leg_id] = tuple(
            candidate.team_id
            for candidate in ordered
        )

    unavailable = set(context.used_team_ids)
    unavailable.update(
        int(team_id)
        for team_id in additionally_unavailable_team_ids
    )

    assignment = _find_distinct_holiday_assignment(
        required_leg_ids,
        available,
        unavailable,
    )

    if assignment is None:
        return HolidayFeasibility(
            feasible=False,
            required_holiday_leg_ids=required_leg_ids,
            available_team_ids_by_leg=available,
            reserved_team_ids=(),
            reason=(
                "No distinct unused-team assignment exists for all "
                "remaining CIRCA holiday legs."
            ),
        )

    return HolidayFeasibility(
        feasible=True,
        required_holiday_leg_ids=required_leg_ids,
        available_team_ids_by_leg=available,
        reserved_team_ids=assignment,
        reason=None,
    )


def path_preserves_circa_holidays(
    context: StrategyContext,
    all_candidates: Sequence[StrategyCandidate],
    partial_path: Sequence[StrategyCandidate],
) -> HolidayFeasibility:
    """
    Check whether teams consumed by a partial path leave a feasible
    assignment for every remaining CIRCA holiday leg.
    """
    consumed_team_ids = {
        candidate.team_id
        for candidate in partial_path
        if not candidate.is_special_leg
    }

    return check_circa_holiday_feasibility(
        context,
        all_candidates,
        additionally_unavailable_team_ids=consumed_team_ids,
    )


def deterministic_path_sort_key(
    path: Sequence[StrategyCandidate],
) -> tuple:
    """
    Produce a stable path-comparison key.

    Higher survival probability is preferred. Ties are resolved by
    lexicographic team abbreviation order by contest leg.
    """
    ordered = sorted(
        path,
        key=lambda candidate: candidate.leg_number,
    )

    return (
        -path_log_probability(ordered),
        tuple(
            candidate.team_abbr
            for candidate in ordered
        ),
    )


def choose_better_path(
    first: Sequence[StrategyCandidate] | None,
    second: Sequence[StrategyCandidate] | None,
) -> Sequence[StrategyCandidate] | None:
    """
    Return the stronger valid path using deterministic comparison.
    """
    if first is None:
        return second

    if second is None:
        return first

    if deterministic_path_sort_key(first) <= (
        deterministic_path_sort_key(second)
    ):
        return first

    return second
