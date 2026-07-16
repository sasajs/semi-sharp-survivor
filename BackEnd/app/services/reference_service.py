from __future__ import annotations

from decimal import Decimal
from typing import Any

from psycopg2.extras import RealDictCursor

from app.db import get_connection


class ReferenceDataError(ValueError):
    pass


def _number(value: Any) -> float | None:
    if value is None:
        return None

    if isinstance(value, Decimal):
        return float(value)

    return float(value)


def get_home_field_advantage(
    season: int,
) -> dict[str, Any]:
    if season < 2000 or season > 2100:
        raise ReferenceDataError(
            "Season must be between 2000 and 2100."
        )

    sql = """
        SELECT
            h.home_field_advantage_id,
            h.season,
            h.team_id,
            t.team_abbr,
            t.team_name,
            t.team_nick,
            t.conference,
            t.division,
            h.home_field_points,
            h.source_system,
            h.notes,
            h.is_active,
            h.created_at
        FROM reference.home_field_advantage h
        JOIN reference.teams t
          ON t.team_id = h.team_id
        WHERE h.season = %s
          AND h.is_active = TRUE
          AND t.is_active = TRUE
        ORDER BY
            h.home_field_points DESC,
            t.team_abbr ASC;
    """

    with get_connection() as conn:
        with conn.cursor(
            cursor_factory=RealDictCursor
        ) as cur:
            cur.execute(
                sql,
                (season,),
            )
            rows = cur.fetchall()

    advantages = []

    for index, row in enumerate(rows, start=1):
        advantages.append(
            {
                "rank": index,
                "home_field_advantage_id": (
                    row["home_field_advantage_id"]
                ),
                "season": row["season"],
                "team_id": row["team_id"],
                "team": row["team_abbr"],
                "team_name": row["team_name"],
                "team_nick": row["team_nick"],
                "conference": row["conference"],
                "division": row["division"],
                "home_field_points": _number(
                    row["home_field_points"]
                ),
                "source_system": row["source_system"],
                "notes": row["notes"],
                "is_active": row["is_active"],
                "created_at": (
                    row["created_at"].isoformat()
                    if row["created_at"]
                    else None
                ),
            }
        )

    source_systems = sorted(
        {
            item["source_system"]
            for item in advantages
            if item["source_system"]
        }
    )

    hfa_values = [
        item["home_field_points"]
        for item in advantages
        if item["home_field_points"] is not None
    ]

    return {
        "season": season,
        "count": len(advantages),
        "source_systems": source_systems,
        "minimum_home_field_points": (
            min(hfa_values) if hfa_values else None
        ),
        "maximum_home_field_points": (
            max(hfa_values) if hfa_values else None
        ),
        "advantages": advantages,
    }
