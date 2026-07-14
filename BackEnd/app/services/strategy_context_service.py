from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from app.db import get_connection


VALID_CONTEST_FORMATS = {"STANDARD", "CIRCA"}


class StrategyContextError(ValueError):
    """Raised when a valid strategy context cannot be assembled."""


@dataclass(frozen=True, slots=True)
class StrategyContext:
    # Application context
    season: int
    current_week: int
    rating_week: int
    projection_model: str
    hfa_source: str
    risk_model: str
    probability_model: str

    # Contest context
    contest_format_id: int
    contest_format: str
    current_contest_leg_id: int
    current_leg_number: int
    current_leg_code: str
    current_leg_name: str
    current_leg_special_type: str | None
    is_special_leg: bool

    # Entry context
    entry_id: int
    user_id: int
    survivor_sweat_name: str
    entry_is_active: bool

    # Historical entry state
    used_team_ids: tuple[int, ...]
    used_team_abbreviations: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _row_to_dict(cursor, row) -> dict[str, Any]:
    columns = [description[0] for description in cursor.description]
    return dict(zip(columns, row))


def _load_application_context(cursor) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT
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
        raise StrategyContextError(
            "No active application context is configured."
        )

    context = _row_to_dict(cursor, row)

    required_models = (
        "projection_model",
        "hfa_source",
        "risk_model",
        "probability_model",
    )

    missing = [
        field
        for field in required_models
        if not context.get(field)
    ]

    if missing:
        raise StrategyContextError(
            "Application context is missing required values: "
            + ", ".join(missing)
        )

    return context


def _load_entry(cursor, entry_id: int) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT
            entry_id,
            user_id,
            survivor_sweat_name,
            is_active
        FROM survivor.entries
        WHERE entry_id = %s;
        """,
        (entry_id,),
    )

    row = cursor.fetchone()

    if row is None:
        raise StrategyContextError(
            f"Survivor entry {entry_id} does not exist."
        )

    entry = _row_to_dict(cursor, row)

    if not entry["is_active"]:
        raise StrategyContextError(
            f"Survivor entry {entry_id} is inactive."
        )

    return entry


def _load_contest_format(
    cursor,
    contest_format: str,
) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT
            contest_format_id,
            format_code,
            format_name
        FROM contest.formats
        WHERE format_code = %s
          AND is_active = TRUE;
        """,
        (contest_format,),
    )

    row = cursor.fetchone()

    if row is None:
        raise StrategyContextError(
            f"Contest format {contest_format} is invalid or inactive."
        )

    return _row_to_dict(cursor, row)


def _resolve_contest_leg(
    cursor,
    *,
    season: int,
    current_week: int,
    contest_format_id: int,
    contest_leg_id: int | None,
) -> dict[str, Any]:
    if contest_leg_id is not None:
        cursor.execute(
            """
            SELECT
                contest_leg_id,
                leg_number,
                leg_code,
                leg_name,
                nfl_week,
                special_leg_type,
                is_special_leg
            FROM contest.legs
            WHERE contest_leg_id = %s
              AND contest_format_id = %s
              AND season = %s;
            """,
            (
                contest_leg_id,
                contest_format_id,
                season,
            ),
        )

        row = cursor.fetchone()

        if row is None:
            raise StrategyContextError(
                "The requested contest leg does not belong to the "
                "active season and contest format."
            )

        return _row_to_dict(cursor, row)

    cursor.execute(
        """
        SELECT
            contest_leg_id,
            leg_number,
            leg_code,
            leg_name,
            nfl_week,
            special_leg_type,
            is_special_leg
        FROM contest.legs
        WHERE contest_format_id = %s
          AND season = %s
          AND nfl_week = %s
          AND is_special_leg = FALSE
        ORDER BY leg_number;
        """,
        (
            contest_format_id,
            season,
            current_week,
        ),
    )

    rows = cursor.fetchall()

    if len(rows) == 0:
        raise StrategyContextError(
            "No regular contest leg was found for the active week. "
            "Provide an explicit contest_leg_id for a special leg."
        )

    if len(rows) > 1:
        raise StrategyContextError(
            "Multiple contest legs match the active week. "
            "Provide an explicit contest_leg_id."
        )

    return _row_to_dict(cursor, rows[0])


def _load_used_teams(
    cursor,
    entry_id: int,
) -> tuple[tuple[int, ...], tuple[str, ...]]:
    cursor.execute(
        """
        SELECT DISTINCT
            ep.team_id,
            t.team_abbr
        FROM survivor.entry_picks ep
        JOIN reference.teams t
          ON t.team_id = ep.team_id
        WHERE ep.entry_id = %s
        ORDER BY t.team_abbr;
        """,
        (entry_id,),
    )

    rows = cursor.fetchall()

    used_team_ids = tuple(sorted(row[0] for row in rows))
    used_team_abbreviations = tuple(row[1] for row in rows)

    return used_team_ids, used_team_abbreviations


def build_strategy_context(
    *,
    entry_id: int,
    contest_format: str,
    contest_leg_id: int | None = None,
) -> StrategyContext:
    format_code = contest_format.strip().upper()

    if format_code not in VALID_CONTEST_FORMATS:
        raise StrategyContextError(
            "contest_format must be STANDARD or CIRCA."
        )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            application = _load_application_context(cursor)
            entry = _load_entry(cursor, entry_id)
            contest = _load_contest_format(
                cursor,
                format_code,
            )

            leg = _resolve_contest_leg(
                cursor,
                season=application["season"],
                current_week=application["current_week"],
                contest_format_id=contest["contest_format_id"],
                contest_leg_id=contest_leg_id,
            )

            used_team_ids, used_team_abbreviations = (
                _load_used_teams(cursor, entry_id)
            )

    return StrategyContext(
        season=application["season"],
        current_week=application["current_week"],
        rating_week=application["rating_week"],
        projection_model=application["projection_model"],
        hfa_source=application["hfa_source"],
        risk_model=application["risk_model"],
        probability_model=application["probability_model"],
        contest_format_id=contest["contest_format_id"],
        contest_format=contest["format_code"],
        current_contest_leg_id=leg["contest_leg_id"],
        current_leg_number=leg["leg_number"],
        current_leg_code=leg["leg_code"],
        current_leg_name=leg["leg_name"],
        current_leg_special_type=leg["special_leg_type"],
        is_special_leg=leg["is_special_leg"],
        entry_id=entry["entry_id"],
        user_id=entry["user_id"],
        survivor_sweat_name=entry["survivor_sweat_name"],
        entry_is_active=entry["is_active"],
        used_team_ids=used_team_ids,
        used_team_abbreviations=used_team_abbreviations,
    )
