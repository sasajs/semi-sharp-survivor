#!/usr/bin/env python3
"""
Transaction-safe smoke test for in-season pick management.

The test uses Entry 1 and CIRCA Week 1, but performs every write inside
one database transaction that is rolled back at the end.

No current pick or audit-history row persists after the test.
"""

from __future__ import annotations

from app.db import get_connection
from app.services.season_management_service import (
    SeasonManagementError,
    _load_contest_leg,
    _load_entry,
    _load_valid_team_option_safe,
    _validate_source,
    _validate_status,
)


ENTRY_ID = 1
CONTEST_LEG_ID = 19


def main() -> None:
    connection = get_connection()
    connection.autocommit = False

    try:
        with connection.cursor() as cursor:
            _load_entry(cursor, ENTRY_ID)

            leg = _load_contest_leg(
                cursor,
                CONTEST_LEG_ID,
            )

            cursor.execute(
                """
                SELECT team_id
                FROM survivor.entry_picks
                WHERE entry_id = %s
                  AND contest_leg_id = %s;
                """,
                (
                    ENTRY_ID,
                    CONTEST_LEG_ID,
                ),
            )

            if cursor.fetchone() is not None:
                raise RuntimeError(
                    "Entry 1 already has a stored Week 1 pick. "
                    "The smoke test will not overwrite it."
                )

            cursor.execute(
                """
                SELECT
                    g.home_team_id,
                    g.away_team_id
                FROM schedule.games g
                WHERE g.season = %s
                  AND g.week = %s
                  AND g.game_type = 'REG'
                  AND g.is_thanksgiving = FALSE
                  AND g.is_christmas = FALSE
                ORDER BY g.game_id
                LIMIT 1;
                """,
                (
                    leg["season"],
                    leg["nfl_week"],
                ),
            )

            row = cursor.fetchone()

            if row is None:
                raise RuntimeError(
                    "No Week 1 game was available for the smoke test."
                )

            first_team_id = int(row[0])
            second_team_id = int(row[1])

            first_team = _load_valid_team_option_safe(
                cursor,
                leg=leg,
                team_id=first_team_id,
            )

            second_team = _load_valid_team_option_safe(
                cursor,
                leg=leg,
                team_id=second_team_id,
            )

            print(
                "Create:",
                first_team["team_abbr"],
                "vs",
                first_team["opponent_team_abbr"],
            )

            cursor.execute(
                """
                INSERT INTO survivor.entry_picks (
                    entry_id,
                    contest_leg_id,
                    team_id,
                    pick_source,
                    pick_status,
                    notes,
                    updated_at,
                    change_reason
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    now(),
                    %s
                )
                RETURNING entry_pick_id;
                """,
                (
                    ENTRY_ID,
                    CONTEST_LEG_ID,
                    first_team_id,
                    _validate_source("USER_ENTRY"),
                    _validate_status("CONFIRMED"),
                    "Automated transaction smoke test",
                    "SMOKE_TEST_CREATE",
                ),
            )

            entry_pick_id = int(
                cursor.fetchone()[0]
            )

            cursor.execute(
                """
                SELECT operation
                FROM survivor.entry_pick_history
                WHERE entry_pick_id = %s
                ORDER BY entry_pick_history_id;
                """,
                (entry_pick_id,),
            )

            operations = [
                row[0]
                for row in cursor.fetchall()
            ]

            if operations != ["INSERT"]:
                raise AssertionError(
                    "Expected one INSERT audit record; "
                    f"found {operations}."
                )

            duplicate_rejected = False

            cursor.execute("SAVEPOINT duplicate_test;")

            try:
                cursor.execute(
                    """
                    INSERT INTO survivor.entry_picks (
                        entry_id,
                        contest_leg_id,
                        team_id,
                        pick_source,
                        pick_status
                    )
                    VALUES (%s, %s, %s, %s, %s);
                    """,
                    (
                        ENTRY_ID,
                        CONTEST_LEG_ID,
                        second_team_id,
                        "USER_ENTRY",
                        "CONFIRMED",
                    ),
                )

            except Exception:
                cursor.execute(
                    "ROLLBACK TO SAVEPOINT duplicate_test;"
                )
                duplicate_rejected = True

            finally:
                cursor.execute(
                    "RELEASE SAVEPOINT duplicate_test;"
                )

            if not duplicate_rejected:
                raise AssertionError(
                    "Duplicate contest-leg pick was not rejected."
                )

            print(
                "Correct:",
                first_team["team_abbr"],
                "to",
                second_team["team_abbr"],
            )

            cursor.execute(
                """
                UPDATE survivor.entry_picks
                SET
                    team_id = %s,
                    pick_source = 'ADMIN_CORRECTION',
                    pick_status = 'CONFIRMED',
                    notes = %s,
                    updated_at = now(),
                    change_reason = %s
                WHERE entry_pick_id = %s;
                """,
                (
                    second_team_id,
                    "Automated transaction correction",
                    "SMOKE_TEST_CORRECTION",
                    entry_pick_id,
                ),
            )

            cursor.execute(
                """
                DELETE FROM survivor.entry_picks
                WHERE entry_pick_id = %s;
                """,
                (entry_pick_id,),
            )

            cursor.execute(
                """
                SELECT operation
                FROM survivor.entry_pick_history
                WHERE entry_pick_id = %s
                ORDER BY entry_pick_history_id;
                """,
                (entry_pick_id,),
            )

            operations = [
                row[0]
                for row in cursor.fetchall()
            ]

            expected = [
                "INSERT",
                "UPDATE",
                "DELETE",
            ]

            if operations != expected:
                raise AssertionError(
                    f"Expected {expected}; found {operations}."
                )

            print(
                "History operations:",
                operations,
            )
            print(
                "SEASON MANAGEMENT SMOKE TEST PASSED"
            )

    finally:
        # Rolls back current-pick changes and trigger-created history.
        connection.rollback()
        connection.close()


if __name__ == "__main__":
    main()
