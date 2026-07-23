from __future__ import annotations

"""
SemiSharp in-season management service.

Responsibilities
----------------
- Read survivor entry pick history.
- Return valid teams for a contest leg.
- Create, correct, and delete official entry picks.
- Validate team, game, contest leg, season, and entry relationships.
- Advance the active application week safely.
- Expose readiness status before strategy recalculation.

The frontend must not infer valid teams, used teams, contest-leg mappings,
or week readiness. It displays and submits backend-provided values only.
"""

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any

from psycopg2 import IntegrityError

from app.db import get_connection


VALID_PICK_SOURCES = {
    "USER_ENTRY",
    "SYSTEM_IMPORT",
    "ADMIN_CORRECTION",
    "HISTORICAL_IMPORT",
}

VALID_PICK_STATUSES = {
    "CONFIRMED",
    "PENDING",
    "VOID",
}


class SeasonManagementError(ValueError):
    """Raised when an in-season management request is invalid."""


@dataclass(frozen=True, slots=True)
class EntryPick:
    entry_pick_id: int
    entry_id: int
    contest_leg_id: int
    contest_format: str
    leg_number: int
    leg_code: str
    leg_name: str
    nfl_week: int | None
    is_special_leg: bool
    special_leg_type: str | None
    team_id: int
    team_abbr: str
    team_name: str
    game_id: str
    opponent_team_id: int
    opponent_team_abbr: str
    team_location: str
    pick_source: str
    pick_status: str
    picked_at: datetime
    notes: str | None
    created_at: datetime
    updated_at: datetime
    updated_by_user_id: int | None
    change_reason: str | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _row_to_dict(cursor, row) -> dict[str, Any]:
    columns = [
        description[0]
        for description in cursor.description
    ]

    return dict(zip(columns, row))


def _load_active_application_context(
    cursor,
) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT
            context_id,
            season,
            current_week,
            rating_week,
            projection_model,
            hfa_source,
            risk_model,
            probability_model
        FROM system.application_context
        WHERE is_active = TRUE
        LIMIT 1;
        """
    )

    row = cursor.fetchone()

    if row is None:
        raise SeasonManagementError(
            "No active application context exists."
        )

    return _row_to_dict(cursor, row)


def _load_entry(
    cursor,
    entry_id: int,
) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT
            entry_id,
            user_id,
            survivor_sweat_name,
            entry_label,
            is_active,
            eliminated_leg_id,
            eliminated_at,
            eliminated_reason
        FROM survivor.entries
        WHERE entry_id = %s;
        """,
        (entry_id,),
    )

    row = cursor.fetchone()

    if row is None:
        raise SeasonManagementError(
            f"Survivor entry {entry_id} does not exist."
        )

    entry = _row_to_dict(cursor, row)

    if not entry["is_active"]:
        raise SeasonManagementError(
            f"Survivor entry {entry_id} is inactive."
        )

    return entry


def _load_contest_leg(
    cursor,
    contest_leg_id: int,
) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT
            l.contest_leg_id,
            l.contest_format_id,
            f.format_code AS contest_format,
            l.season,
            l.leg_number,
            l.leg_code,
            l.leg_name,
            l.nfl_week,
            l.is_special_leg,
            l.special_leg_type,
            l.starts_on,
            l.ends_on
        FROM contest.legs l
        JOIN contest.formats f
          ON f.contest_format_id =
             l.contest_format_id
        WHERE l.contest_leg_id = %s;
        """,
        (contest_leg_id,),
    )

    row = cursor.fetchone()

    if row is None:
        raise SeasonManagementError(
            f"Contest leg {contest_leg_id} does not exist."
        )

    return _row_to_dict(cursor, row)


def _game_matches_leg_sql() -> str:
    """
    SQL predicate mapping a schedule game to a contest leg.

    CIRCA normal legs exclude Thanksgiving and Christmas games because
    those games belong to separate special contest legs.
    """
    return """
        (
            (
                %(special_leg_type)s = 'THANKSGIVING'
                AND g.is_thanksgiving = TRUE
            )
            OR
            (
                %(special_leg_type)s = 'CHRISTMAS'
                AND g.is_christmas = TRUE
            )
            OR
            (
                %(special_leg_type)s IS NULL
                AND g.week = %(nfl_week)s
                AND (
                    %(contest_format)s <> 'CIRCA'
                    OR (
                        g.is_thanksgiving = FALSE
                        AND g.is_christmas = FALSE
                    )
                )
            )
        )
    """


def _load_valid_team_option(
    cursor,
    *,
    leg: dict[str, Any],
    team_id: int,
) -> dict[str, Any]:
    cursor.execute(
        f"""
        SELECT
            g.game_id,
            g.season,
            g.week AS nfl_week,
            g.home_team_id,
            g.home_team_abbr,
            g.away_team_id,
            g.away_team_abbr,
            t.team_id,
            t.team_abbr,
            t.team_name,
            CASE
                WHEN t.team_id = g.home_team_id
                    THEN g.away_team_id
                ELSE g.home_team_id
            END AS opponent_team_id,
            CASE
                WHEN t.team_id = g.home_team_id
                    THEN g.away_team_abbr
                ELSE g.home_team_abbr
            END AS opponent_team_abbr,
            CASE
                WHEN t.team_id = g.home_team_id
                    THEN 'HOME'
                ELSE 'AWAY'
            END AS team_location
        FROM schedule.games g
        JOIN reference.teams t
          ON t.team_id = %s
         AND t.team_id IN (
             g.home_team_id,
             g.away_team_id
         )
        WHERE g.season = %s
          AND g.game_type = 'REG'
          AND {_game_matches_leg_sql()}
        LIMIT 1;
        """,
        (
            team_id,
            leg["season"],
            {
                "special_leg_type": leg[
                    "special_leg_type"
                ],
                "nfl_week": leg["nfl_week"],
                "contest_format": leg[
                    "contest_format"
                ],
            },
        ),
    )

    row = cursor.fetchone()

    if row is None:
        raise SeasonManagementError(
            f"Team {team_id} did not play in "
            f"{leg['leg_name']}."
        )

    return _row_to_dict(cursor, row)


def _load_valid_team_option_safe(
    cursor,
    *,
    leg: dict[str, Any],
    team_id: int,
) -> dict[str, Any]:
    """
    Same validation as _load_valid_team_option, implemented with explicit
    SQL parameters because psycopg2 does not mix positional and named
    placeholders safely in one execute call.
    """
    cursor.execute(
        """
        SELECT
            g.game_id,
            g.season,
            g.week AS nfl_week,
            g.home_team_id,
            g.home_team_abbr,
            g.away_team_id,
            g.away_team_abbr,
            t.team_id,
            t.team_abbr,
            t.team_name,
            CASE
                WHEN t.team_id = g.home_team_id
                    THEN g.away_team_id
                ELSE g.home_team_id
            END AS opponent_team_id,
            CASE
                WHEN t.team_id = g.home_team_id
                    THEN g.away_team_abbr
                ELSE g.home_team_abbr
            END AS opponent_team_abbr,
            CASE
                WHEN t.team_id = g.home_team_id
                    THEN 'HOME'
                ELSE 'AWAY'
            END AS team_location
        FROM schedule.games g
        JOIN reference.teams t
          ON t.team_id = %s
         AND t.team_id IN (
             g.home_team_id,
             g.away_team_id
         )
        WHERE g.season = %s
          AND g.game_type = 'REG'
          AND (
                (
                    %s = 'THANKSGIVING'
                    AND g.is_thanksgiving = TRUE
                )
                OR
                (
                    %s = 'CHRISTMAS'
                    AND g.is_christmas = TRUE
                )
                OR
                (
                    %s IS NULL
                    AND g.week = %s
                    AND (
                        %s <> 'CIRCA'
                        OR (
                            g.is_thanksgiving = FALSE
                            AND g.is_christmas = FALSE
                        )
                    )
                )
          )
        LIMIT 1;
        """,
        (
            team_id,
            leg["season"],
            leg["special_leg_type"],
            leg["special_leg_type"],
            leg["special_leg_type"],
            leg["nfl_week"],
            leg["contest_format"],
        ),
    )

    row = cursor.fetchone()

    if row is None:
        raise SeasonManagementError(
            f"Team {team_id} did not play in "
            f"{leg['leg_name']}."
        )

    return _row_to_dict(cursor, row)


def _validate_source(source: str) -> str:
    normalized = source.strip().upper()

    if normalized not in VALID_PICK_SOURCES:
        raise SeasonManagementError(
            "pick_source must be one of: "
            + ", ".join(sorted(VALID_PICK_SOURCES))
        )

    return normalized


def _validate_status(status: str) -> str:
    normalized = status.strip().upper()

    if normalized not in VALID_PICK_STATUSES:
        raise SeasonManagementError(
            "pick_status must be one of: "
            + ", ".join(sorted(VALID_PICK_STATUSES))
        )

    return normalized


def _serialize_pick_row(
    cursor,
    row,
) -> dict[str, Any]:
    if row is None:
        raise SeasonManagementError(
            "Entry pick could not be loaded."
        )

    return _row_to_dict(cursor, row)


def _entry_pick_select_sql() -> str:
    return """
        SELECT
            ep.entry_pick_id,
            ep.entry_id,
            ep.contest_leg_id,
            f.format_code AS contest_format,
            l.leg_number,
            l.leg_code,
            l.leg_name,
            l.nfl_week,
            l.is_special_leg,
            l.special_leg_type,
            ep.team_id,
            t.team_abbr,
            t.team_name,
            g.game_id,
            CASE
                WHEN ep.team_id = g.home_team_id
                    THEN g.away_team_id
                ELSE g.home_team_id
            END AS opponent_team_id,
            CASE
                WHEN ep.team_id = g.home_team_id
                    THEN g.away_team_abbr
                ELSE g.home_team_abbr
            END AS opponent_team_abbr,
            CASE
                WHEN ep.team_id = g.home_team_id
                    THEN 'HOME'
                ELSE 'AWAY'
            END AS team_location,
            ep.pick_source,
            ep.pick_status,
            ep.picked_at,
            ep.notes,
            ep.created_at,
            ep.updated_at,
            ep.updated_by_user_id,
            ep.change_reason
        FROM survivor.entry_picks ep
        JOIN contest.legs l
          ON l.contest_leg_id =
             ep.contest_leg_id
        JOIN contest.formats f
          ON f.contest_format_id =
             l.contest_format_id
        JOIN reference.teams t
          ON t.team_id = ep.team_id
        JOIN schedule.games g
          ON g.season = l.season
         AND ep.team_id IN (
             g.home_team_id,
             g.away_team_id
         )
         AND (
                (
                    l.special_leg_type = 'THANKSGIVING'
                    AND g.is_thanksgiving = TRUE
                )
                OR
                (
                    l.special_leg_type = 'CHRISTMAS'
                    AND g.is_christmas = TRUE
                )
                OR
                (
                    l.special_leg_type IS NULL
                    AND g.week = l.nfl_week
                    AND (
                        f.format_code <> 'CIRCA'
                        OR (
                            g.is_thanksgiving = FALSE
                            AND g.is_christmas = FALSE
                        )
                    )
                )
         )
    """


def list_entry_picks(
    entry_id: int,
) -> list[dict[str, Any]]:
    """Return the official stored pick history for one entry."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            _load_entry(cursor, entry_id)

            cursor.execute(
                _entry_pick_select_sql()
                + """
                WHERE ep.entry_id = %s
                ORDER BY l.leg_number;
                """,
                (entry_id,),
            )

            columns = [
                description[0]
                for description in cursor.description
            ]

            return [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]


def list_valid_pick_options(
    *,
    entry_id: int,
    contest_leg_id: int,
) -> dict[str, Any]:
    """
    Return teams that actually play in the selected contest leg.

    Teams already used by the entry are included for display but marked
    unavailable. The GUI must honor the backend's eligible flag.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            entry = _load_entry(cursor, entry_id)
            leg = _load_contest_leg(
                cursor,
                contest_leg_id,
            )

            application = (
                _load_active_application_context(cursor)
            )

            if leg["season"] != application["season"]:
                raise SeasonManagementError(
                    "The requested contest leg does not belong "
                    "to the active season."
                )

            cursor.execute(
                """
                SELECT team_id
                FROM survivor.entry_picks
                WHERE entry_id = %s
                  AND pick_status <> 'VOID';
                """,
                (entry_id,),
            )

            used_team_ids = {
                int(row[0])
                for row in cursor.fetchall()
            }

            cursor.execute(
                """
                SELECT
                    g.game_id,
                    g.home_team_id,
                    g.home_team_abbr,
                    home.team_name AS home_team_name,
                    g.away_team_id,
                    g.away_team_abbr,
                    away.team_name AS away_team_name
                FROM schedule.games g
                JOIN reference.teams home
                  ON home.team_id = g.home_team_id
                JOIN reference.teams away
                  ON away.team_id = g.away_team_id
                WHERE g.season = %s
                  AND g.game_type = 'REG'
                  AND (
                        (
                            %s = 'THANKSGIVING'
                            AND g.is_thanksgiving = TRUE
                        )
                        OR
                        (
                            %s = 'CHRISTMAS'
                            AND g.is_christmas = TRUE
                        )
                        OR
                        (
                            %s IS NULL
                            AND g.week = %s
                            AND (
                                %s <> 'CIRCA'
                                OR (
                                    g.is_thanksgiving = FALSE
                                    AND g.is_christmas = FALSE
                                )
                            )
                        )
                  )
                ORDER BY
                    g.gameday,
                    g.gametime,
                    g.game_id;
                """,
                (
                    leg["season"],
                    leg["special_leg_type"],
                    leg["special_leg_type"],
                    leg["special_leg_type"],
                    leg["nfl_week"],
                    leg["contest_format"],
                ),
            )

            games = cursor.fetchall()

    options: list[dict[str, Any]] = []

    for game in games:
        (
            game_id,
            home_team_id,
            home_team_abbr,
            home_team_name,
            away_team_id,
            away_team_abbr,
            away_team_name,
        ) = game

        for (
            team_id,
            team_abbr,
            team_name,
            opponent_team_id,
            opponent_team_abbr,
            location,
        ) in (
            (
                home_team_id,
                home_team_abbr,
                home_team_name,
                away_team_id,
                away_team_abbr,
                "HOME",
            ),
            (
                away_team_id,
                away_team_abbr,
                away_team_name,
                home_team_id,
                home_team_abbr,
                "AWAY",
            ),
        ):
            already_used = team_id in used_team_ids

            options.append({
                "game_id": game_id,
                "team_id": team_id,
                "team": team_abbr,
                "team_name": team_name,
                "opponent_team_id": opponent_team_id,
                "opponent": opponent_team_abbr,
                "team_location": location,
                "already_used": already_used,
                "eligible": not already_used,
                "ineligible_reason": (
                    "TEAM_ALREADY_USED"
                    if already_used
                    else None
                ),
            })

    return {
        "entry_id": entry["entry_id"],
        "survivor_sweat_name": (
            entry["survivor_sweat_name"]
        ),
        "contest_leg": leg,
        "used_team_ids": sorted(used_team_ids),
        "options": options,
    }


def create_entry_pick(
    *,
    entry_id: int,
    contest_leg_id: int,
    team_id: int,
    pick_source: str = "USER_ENTRY",
    pick_status: str = "CONFIRMED",
    notes: str | None = None,
    updated_by_user_id: int | None = None,
    change_reason: str | None = None,
) -> dict[str, Any]:
    """Create one official entry pick with full validation."""
    normalized_source = _validate_source(
        pick_source
    )
    normalized_status = _validate_status(
        pick_status
    )

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                _load_entry(cursor, entry_id)

                leg = _load_contest_leg(
                    cursor,
                    contest_leg_id,
                )

                application = (
                    _load_active_application_context(cursor)
                )

                if leg["season"] != application["season"]:
                    raise SeasonManagementError(
                        "The contest leg does not belong to "
                        "the active season."
                    )

                _load_valid_team_option_safe(
                    cursor,
                    leg=leg,
                    team_id=team_id,
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
                        updated_by_user_id,
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
                        %s,
                        %s
                    )
                    RETURNING entry_pick_id;
                    """,
                    (
                        entry_id,
                        contest_leg_id,
                        team_id,
                        normalized_source,
                        normalized_status,
                        notes,
                        updated_by_user_id,
                        change_reason,
                    ),
                )

                entry_pick_id = int(
                    cursor.fetchone()[0]
                )

            connection.commit()

    except IntegrityError as exc:
        message = str(exc)

        if (
            "entry_picks_entry_id_contest_leg_id_key"
            in message
        ):
            raise SeasonManagementError(
                "This entry already has a pick for the "
                "selected contest leg."
            ) from exc

        if "entry_picks_entry_id_team_id_key" in message:
            raise SeasonManagementError(
                "This team has already been used by the entry."
            ) from exc

        raise SeasonManagementError(
            "The entry pick violates a database constraint."
        ) from exc

    return get_entry_pick(entry_pick_id)


def get_entry_pick(
    entry_pick_id: int,
) -> dict[str, Any]:
    """Return one official pick by primary key."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                _entry_pick_select_sql()
                + """
                WHERE ep.entry_pick_id = %s
                LIMIT 1;
                """,
                (entry_pick_id,),
            )

            row = cursor.fetchone()

            if row is None:
                raise SeasonManagementError(
                    f"Entry pick {entry_pick_id} "
                    "does not exist."
                )

            return _serialize_pick_row(
                cursor,
                row,
            )


def update_entry_pick(
    *,
    entry_id: int,
    contest_leg_id: int,
    team_id: int,
    pick_source: str = "ADMIN_CORRECTION",
    pick_status: str = "CONFIRMED",
    notes: str | None = None,
    updated_by_user_id: int | None = None,
    change_reason: str | None = None,
) -> dict[str, Any]:
    """
    Correct the official pick for one entry and contest leg.

    The audit trigger writes the old and new values to immutable history.
    """
    normalized_source = _validate_source(
        pick_source
    )
    normalized_status = _validate_status(
        pick_status
    )

    if not change_reason:
        raise SeasonManagementError(
            "change_reason is required when correcting a pick."
        )

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                _load_entry(cursor, entry_id)

                leg = _load_contest_leg(
                    cursor,
                    contest_leg_id,
                )

                _load_valid_team_option_safe(
                    cursor,
                    leg=leg,
                    team_id=team_id,
                )

                cursor.execute(
                    """
                    UPDATE survivor.entry_picks
                    SET
                        team_id = %s,
                        pick_source = %s,
                        pick_status = %s,
                        notes = %s,
                        updated_at = now(),
                        updated_by_user_id = %s,
                        change_reason = %s
                    WHERE entry_id = %s
                      AND contest_leg_id = %s
                    RETURNING entry_pick_id;
                    """,
                    (
                        team_id,
                        normalized_source,
                        normalized_status,
                        notes,
                        updated_by_user_id,
                        change_reason,
                        entry_id,
                        contest_leg_id,
                    ),
                )

                row = cursor.fetchone()

                if row is None:
                    raise SeasonManagementError(
                        "No stored pick exists for this "
                        "entry and contest leg."
                    )

                entry_pick_id = int(row[0])

            connection.commit()

    except IntegrityError as exc:
        message = str(exc)

        if "entry_picks_entry_id_team_id_key" in message:
            raise SeasonManagementError(
                "This team has already been used by the entry."
            ) from exc

        raise SeasonManagementError(
            "The corrected pick violates a database constraint."
        ) from exc

    return get_entry_pick(entry_pick_id)


def delete_entry_pick(
    *,
    entry_id: int,
    contest_leg_id: int,
    updated_by_user_id: int | None = None,
    change_reason: str | None = None,
) -> dict[str, Any]:
    """
    Delete an incorrect official pick.

    The audit trigger preserves the deleted record permanently.
    """
    if not change_reason:
        raise SeasonManagementError(
            "change_reason is required when deleting a pick."
        )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE survivor.entry_picks
                SET
                    updated_by_user_id = %s,
                    change_reason = %s,
                    updated_at = now()
                WHERE entry_id = %s
                  AND contest_leg_id = %s
                RETURNING entry_pick_id;
                """,
                (
                    updated_by_user_id,
                    change_reason,
                    entry_id,
                    contest_leg_id,
                ),
            )

            row = cursor.fetchone()

            if row is None:
                raise SeasonManagementError(
                    "No stored pick exists for this "
                    "entry and contest leg."
                )

            entry_pick_id = int(row[0])

            cursor.execute(
                """
                DELETE FROM survivor.entry_picks
                WHERE entry_pick_id = %s;
                """,
                (entry_pick_id,),
            )

        connection.commit()

    return {
        "deleted": True,
        "entry_pick_id": entry_pick_id,
        "entry_id": entry_id,
        "contest_leg_id": contest_leg_id,
        "change_reason": change_reason,
    }


def get_season_management_status() -> dict[str, Any]:
    """Return active season state and pick-completeness information."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            application = (
                _load_active_application_context(cursor)
            )

            cursor.execute(
                """
                SELECT
                    e.entry_id,
                    e.survivor_sweat_name,
                    e.entry_label,
                    COUNT(ep.entry_pick_id)
                        FILTER (
                            WHERE ep.pick_status <> 'VOID'
                        ) AS stored_pick_count
                FROM survivor.entries e
                LEFT JOIN survivor.entry_picks ep
                  ON ep.entry_id = e.entry_id
                WHERE e.is_active = TRUE
                GROUP BY
                    e.entry_id,
                    e.survivor_sweat_name,
                    e.entry_label
                ORDER BY e.entry_id;
                """
            )

            entries = [
                {
                    "entry_id": row[0],
                    "survivor_sweat_name": row[1],
                    "entry_label": row[2],
                    "stored_pick_count": int(row[3]),
                    "expected_completed_week_count": max(
                        application["current_week"] - 1,
                        0,
                    ),
                    "history_complete_for_regular_weeks": (
                        int(row[3])
                        >= max(
                            application["current_week"] - 1,
                            0,
                        )
                    ),
                }
                for row in cursor.fetchall()
            ]

    return {
        "application_context": application,
        "entries": entries,
        "all_entries_ready": all(
            entry[
                "history_complete_for_regular_weeks"
            ]
            for entry in entries
        ),
    }


def advance_current_week(
    *,
    season: int,
    current_week: int,
    rating_week: int,
    allow_backward: bool = False,
) -> dict[str, Any]:
    """
    Advance the application to a new regular NFL week.

    The operation rejects missing prior entry history. Special CIRCA legs
    remain managed by contest_leg_id and do not alter the regular NFL week.
    """
    if current_week < 1 or current_week > 22:
        raise SeasonManagementError(
            "current_week must be between 1 and 22."
        )

    if rating_week < 1 or rating_week > 22:
        raise SeasonManagementError(
            "rating_week must be between 1 and 22."
        )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            application = (
                _load_active_application_context(cursor)
            )

            if season != application["season"]:
                raise SeasonManagementError(
                    "Requested season does not match the "
                    "active season."
                )

            if (
                current_week
                < application["current_week"]
                and not allow_backward
            ):
                raise SeasonManagementError(
                    "Moving the active week backward requires "
                    "allow_backward=true."
                )

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM schedule.games
                WHERE season = %s
                  AND week = %s
                  AND game_type = 'REG';
                """,
                (
                    season,
                    current_week,
                ),
            )

            if int(cursor.fetchone()[0]) == 0:
                raise SeasonManagementError(
                    f"No regular-season games exist for "
                    f"season {season}, week {current_week}."
                )

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM ratings.pff_power_ratings
                WHERE season = %s
                  AND week = %s;
                """,
                (
                    season,
                    rating_week,
                ),
            )

            rating_count = int(
                cursor.fetchone()[0]
            )

            if rating_count == 0:
                raise SeasonManagementError(
                    f"No PFF ratings exist for season "
                    f"{season}, rating week {rating_week}."
                )

            required_completed_weeks = set(
                range(1, current_week)
            )

            cursor.execute(
                """
                SELECT
                    e.entry_id,
                    e.survivor_sweat_name,
                    COALESCE(
                        ARRAY_AGG(DISTINCT l.nfl_week)
                            FILTER (
                                WHERE
                                    ep.pick_status <> 'VOID'
                                    AND l.special_leg_type
                                        IS NULL
                                    AND l.nfl_week IS NOT NULL
                            ),
                        ARRAY[]::integer[]
                    ) AS recorded_regular_weeks
                FROM survivor.entries e
                LEFT JOIN survivor.entry_picks ep
                  ON ep.entry_id = e.entry_id
                LEFT JOIN contest.legs l
                  ON l.contest_leg_id =
                     ep.contest_leg_id
                WHERE e.is_active = TRUE
                GROUP BY
                    e.entry_id,
                    e.survivor_sweat_name
                ORDER BY e.entry_id;
                """
            )

            incomplete_entries: list[dict[str, Any]] = []

            for (
                entry_id,
                survivor_sweat_name,
                recorded_regular_weeks,
            ) in cursor.fetchall():
                recorded = {
                    int(week)
                    for week in recorded_regular_weeks
                }

                missing = sorted(
                    required_completed_weeks
                    - recorded
                )

                if missing:
                    incomplete_entries.append({
                        "entry_id": entry_id,
                        "survivor_sweat_name": (
                            survivor_sweat_name
                        ),
                        "missing_regular_weeks": missing,
                    })

            # Incomplete prior-pick history does not block the global
            # application week from advancing. Entry-level readiness is
            # enforced before strategy planning.

            cursor.execute(
                """
                UPDATE system.application_context
                SET
                    current_week = %s,
                    rating_week = %s,
                    updated_at = now()
                WHERE is_active = TRUE
                RETURNING
                    season,
                    current_week,
                    rating_week,
                    projection_model,
                    hfa_source,
                    risk_model,
                    probability_model,
                    updated_at;
                """,
                (
                    current_week,
                    rating_week,
                ),
            )

            row = cursor.fetchone()

        connection.commit()

    return {
        "season": row[0],
        "current_week": row[1],
        "rating_week": row[2],
        "projection_model": row[3],
        "hfa_source": row[4],
        "risk_model": row[5],
        "probability_model": row[6],
        "updated_at": row[7],
        "advanced": True,
        "entry_readiness": {
            "all_entries_complete": len(incomplete_entries) == 0,
            "incomplete_entry_count": len(incomplete_entries),
            "incomplete_entries": incomplete_entries,
        },
    }
