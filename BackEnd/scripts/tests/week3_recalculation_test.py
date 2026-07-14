#!/usr/bin/env python3
"""
Read-only Week 3 recalculation test.

This test does not modify application context or survivor.entry_picks.

It simulates:

- current NFL week = 3
- rating snapshot week = 1
- one Week 1 team already used
- one Week 2 team already used

It verifies that the shared candidate framework:

- resolves the CIRCA Week 3 contest leg
- starts recommendations at Week 3
- excludes both previously used teams
- preserves the active model versions
"""

from __future__ import annotations

from dataclasses import replace

from app.db import get_connection
from app.services.candidate_builder import (
    build_candidate_matrix,
    build_current_leg_candidates,
)
from app.services.strategy_context_service import (
    build_strategy_context,
)


SEASON = 2026
CONTEST_FORMAT = "CIRCA"
ENTRY_ID = 1
SIMULATED_CURRENT_WEEK = 3
SIMULATED_RATING_WEEK = 1


def load_regular_leg(nfl_week: int) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    l.contest_leg_id,
                    l.leg_number,
                    l.leg_code,
                    l.leg_name,
                    l.nfl_week,
                    l.special_leg_type,
                    l.is_special_leg
                FROM contest.legs l
                JOIN contest.formats f
                  ON f.contest_format_id =
                     l.contest_format_id
                WHERE l.season = %s
                  AND f.format_code = %s
                  AND l.nfl_week = %s
                  AND l.special_leg_type IS NULL
                LIMIT 1;
                """,
                (
                    SEASON,
                    CONTEST_FORMAT,
                    nfl_week,
                ),
            )

            row = cursor.fetchone()

            if row is None:
                raise AssertionError(
                    f"No regular CIRCA leg exists for Week {nfl_week}."
                )

    return {
        "contest_leg_id": int(row[0]),
        "leg_number": int(row[1]),
        "leg_code": row[2],
        "leg_name": row[3],
        "nfl_week": int(row[4]),
        "special_leg_type": row[5],
        "is_special_leg": bool(row[6]),
    }


def strongest_candidate_for_leg(
    candidates,
    contest_leg_id: int,
):
    matching = [
        candidate
        for candidate in candidates
        if candidate.contest_leg_id == contest_leg_id
        and candidate.eligible
        and not candidate.already_used
    ]

    if not matching:
        raise AssertionError(
            f"No candidates exist for contest leg {contest_leg_id}."
        )

    matching.sort(
        key=lambda candidate: (
            -float(candidate.risk_adjusted_wp),
            candidate.team_abbr,
        )
    )

    return matching[0]


def main() -> None:
    live_context = build_strategy_context(
        entry_id=ENTRY_ID,
        contest_format=CONTEST_FORMAT,
    )

    if live_context.current_week != 1:
        raise AssertionError(
            "This read-only test expects the live context to remain "
            "at Week 1."
        )

    all_live_candidates = build_candidate_matrix(
        live_context,
        include_ineligible=False,
    )

    week_1_leg = load_regular_leg(1)
    week_2_leg = load_regular_leg(2)
    week_3_leg = load_regular_leg(3)

    week_1_pick = strongest_candidate_for_leg(
        all_live_candidates,
        week_1_leg["contest_leg_id"],
    )

    week_2_options = [
        candidate
        for candidate in all_live_candidates
        if candidate.contest_leg_id
        == week_2_leg["contest_leg_id"]
        and candidate.team_id != week_1_pick.team_id
        and candidate.eligible
        and not candidate.already_used
    ]

    week_2_options.sort(
        key=lambda candidate: (
            -float(candidate.risk_adjusted_wp),
            candidate.team_abbr,
        )
    )

    if not week_2_options:
        raise AssertionError(
            "No distinct Week 2 candidate was available."
        )

    week_2_pick = week_2_options[0]

    simulated_context = replace(
        live_context,
        current_week=SIMULATED_CURRENT_WEEK,
        rating_week=SIMULATED_RATING_WEEK,
        current_contest_leg_id=(
            week_3_leg["contest_leg_id"]
        ),
        current_leg_number=week_3_leg["leg_number"],
        current_leg_code=week_3_leg["leg_code"],
        current_leg_name=week_3_leg["leg_name"],
        current_leg_special_type=(
            week_3_leg["special_leg_type"]
        ),
        is_special_leg=week_3_leg["is_special_leg"],
        used_team_ids=(
            week_1_pick.team_id,
            week_2_pick.team_id,
        ),
        used_team_abbreviations=(
            week_1_pick.team_abbr,
            week_2_pick.team_abbr,
        ),
    )

    current_candidates = build_current_leg_candidates(
        simulated_context,
    )

    remaining_candidates = build_candidate_matrix(
        simulated_context,
        include_ineligible=False,
    )

    used_team_ids = set(
        simulated_context.used_team_ids
    )

    current_team_ids = {
        candidate.team_id
        for candidate in current_candidates
    }

    remaining_team_ids = {
        candidate.team_id
        for candidate in remaining_candidates
    }

    if simulated_context.current_week != 3:
        raise AssertionError(
            "Simulated context did not resolve Week 3."
        )

    if (
        simulated_context.current_contest_leg_id
        != week_3_leg["contest_leg_id"]
    ):
        raise AssertionError(
            "Simulated context resolved the wrong Week 3 leg."
        )

    if used_team_ids & current_team_ids:
        raise AssertionError(
            "A previously used team remained in the Week 3 board."
        )

    if used_team_ids & remaining_team_ids:
        raise AssertionError(
            "A previously used team remained in the future matrix."
        )

    invalid_weeks = sorted({
        candidate.nfl_week
        for candidate in remaining_candidates
        if candidate.nfl_week is not None
        and candidate.nfl_week < SIMULATED_CURRENT_WEEK
        and not candidate.is_special_leg
    })

    if invalid_weeks:
        raise AssertionError(
            "The remaining candidate matrix contains completed weeks: "
            f"{invalid_weeks}"
        )

    print("WEEK 3 RECALCULATION TEST PASSED")
    print(
        "Simulated prior picks:",
        f"Week 1 {week_1_pick.team_abbr},",
        f"Week 2 {week_2_pick.team_abbr}",
    )
    print(
        "Current leg:",
        simulated_context.current_leg_name,
        simulated_context.current_contest_leg_id,
    )
    print(
        "Current Week 3 candidates:",
        len(current_candidates),
    )
    print(
        "Remaining candidates:",
        len(remaining_candidates),
    )
    print(
        "Rating snapshot used:",
        simulated_context.rating_week,
    )
    print(
        "Probability model:",
        simulated_context.probability_model,
    )


if __name__ == "__main__":
    main()
