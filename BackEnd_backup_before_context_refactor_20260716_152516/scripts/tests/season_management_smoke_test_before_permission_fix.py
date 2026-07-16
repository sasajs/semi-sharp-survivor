#!/usr/bin/env python3
"""
Safe smoke test for SemiSharp in-season pick management.

The test creates a temporary inactive-free survivor entry, exercises:

- valid-pick lookup
- pick creation
- duplicate-leg rejection
- pick correction
- immutable audit history
- pick deletion

The temporary pick, audit rows, and entry are removed in a finally block.
No production entry history is changed.
"""

from __future__ import annotations

import sys
import uuid

from app.db import get_connection
from app.services.season_management_service import (
    SeasonManagementError,
    create_entry_pick,
    delete_entry_pick,
    list_entry_picks,
    list_valid_pick_options,
    update_entry_pick,
)


CONTEST_LEG_ID = 19
SOURCE_ENTRY_ID = 1


def create_temporary_entry() -> int:
    suffix = uuid.uuid4().hex[:10]

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id
                FROM survivor.entries
                WHERE entry_id = %s;
                """,
                (SOURCE_ENTRY_ID,),
            )

            row = cursor.fetchone()

            if row is None:
                raise RuntimeError(
                    f"Source entry {SOURCE_ENTRY_ID} does not exist."
                )

            user_id = int(row[0])

            cursor.execute(
                """
                INSERT INTO survivor.entries (
                    user_id,
                    survivor_sweat_name,
                    entry_label,
                    is_active
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    TRUE
                )
                RETURNING entry_id;
                """,
                (
                    user_id,
                    f"SMOKE-{suffix}",
                    f"Season Management Smoke Test {suffix}",
                ),
            )

            entry_id = int(cursor.fetchone()[0])

        connection.commit()

    return entry_id


def cleanup_temporary_entry(entry_id: int) -> None:
    """
    Remove smoke-test records.

    Audit rows are intentionally deleted here because they belong only to
    a disposable automated test entry, not a production survivor entry.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM survivor.entry_picks
                WHERE entry_id = %s;
                """,
                (entry_id,),
            )

            cursor.execute(
                """
                DELETE FROM survivor.entry_pick_history
                WHERE entry_id = %s;
                """,
                (entry_id,),
            )

            cursor.execute(
                """
                DELETE FROM survivor.entries
                WHERE entry_id = %s;
                """,
                (entry_id,),
            )

        connection.commit()


def load_history_operations(entry_id: int) -> list[str]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT operation
                FROM survivor.entry_pick_history
                WHERE entry_id = %s
                ORDER BY entry_pick_history_id;
                """,
                (entry_id,),
            )

            return [
                str(row[0])
                for row in cursor.fetchall()
            ]


def main() -> None:
    entry_id = create_temporary_entry()

    try:
        print("Temporary entry:", entry_id)

        valid = list_valid_pick_options(
            entry_id=entry_id,
            contest_leg_id=CONTEST_LEG_ID,
        )

        eligible = [
            option
            for option in valid["options"]
            if option["eligible"]
        ]

        if len(eligible) < 2:
            raise AssertionError(
                "Expected at least two eligible Week 1 options."
            )

        first_team = eligible[0]
        second_team = next(
            option
            for option in eligible[1:]
            if option["team_id"] != first_team["team_id"]
        )

        print(
            "Create:",
            first_team["team"],
            "vs",
            first_team["opponent"],
        )

        created = create_entry_pick(
            entry_id=entry_id,
            contest_leg_id=CONTEST_LEG_ID,
            team_id=int(first_team["team_id"]),
            pick_source="USER_ENTRY",
            pick_status="CONFIRMED",
            notes="Automated smoke-test creation",
            change_reason="SMOKE_TEST_CREATE",
        )

        assert created["team_id"] == first_team["team_id"]

        stored = list_entry_picks(entry_id)

        assert len(stored) == 1
        assert stored[0]["team_id"] == first_team["team_id"]

        duplicate_rejected = False

        try:
            create_entry_pick(
                entry_id=entry_id,
                contest_leg_id=CONTEST_LEG_ID,
                team_id=int(second_team["team_id"]),
                pick_source="USER_ENTRY",
                pick_status="CONFIRMED",
            )

        except SeasonManagementError:
            duplicate_rejected = True

        if not duplicate_rejected:
            raise AssertionError(
                "Duplicate contest-leg pick was not rejected."
            )

        print(
            "Correct:",
            first_team["team"],
            "to",
            second_team["team"],
        )

        corrected = update_entry_pick(
            entry_id=entry_id,
            contest_leg_id=CONTEST_LEG_ID,
            team_id=int(second_team["team_id"]),
            pick_source="ADMIN_CORRECTION",
            pick_status="CONFIRMED",
            notes="Automated smoke-test correction",
            change_reason="SMOKE_TEST_CORRECTION",
        )

        assert corrected["team_id"] == second_team["team_id"]

        operations_before_delete = load_history_operations(
            entry_id
        )

        if "INSERT" not in operations_before_delete:
            raise AssertionError(
                "Pick INSERT was not written to audit history."
            )

        if "UPDATE" not in operations_before_delete:
            raise AssertionError(
                "Pick UPDATE was not written to audit history."
            )

        deleted = delete_entry_pick(
            entry_id=entry_id,
            contest_leg_id=CONTEST_LEG_ID,
            change_reason="SMOKE_TEST_DELETE",
        )

        assert deleted["deleted"] is True
        assert list_entry_picks(entry_id) == []

        operations_after_delete = load_history_operations(
            entry_id
        )

        if "DELETE" not in operations_after_delete:
            raise AssertionError(
                "Pick DELETE was not written to audit history."
            )

        print(
            "History operations:",
            operations_after_delete,
        )
        print("SEASON MANAGEMENT SMOKE TEST PASSED")

    finally:
        cleanup_temporary_entry(entry_id)


if __name__ == "__main__":
    try:
        main()

    except Exception as exc:
        print(
            f"SEASON MANAGEMENT SMOKE TEST FAILED: {exc}",
            file=sys.stderr,
        )
        raise
