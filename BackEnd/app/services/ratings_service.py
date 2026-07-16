from __future__ import annotations

from decimal import Decimal
from typing import Any

from psycopg2.extras import RealDictCursor

from app.db import get_connection


class RatingsError(ValueError):
    pass


def _number(value: Any) -> float | None:
    if value is None:
        return None

    if isinstance(value, Decimal):
        return float(value)

    return float(value)


def get_pff_power_rankings(
    season: int,
    week: int,
) -> dict[str, Any]:
    if season < 2000 or season > 2100:
        raise RatingsError(
            "Season must be between 2000 and 2100."
        )

    if week < 1 or week > 22:
        raise RatingsError(
            "Week must be between 1 and 22."
        )

    sql = """
        SELECT
            r.pff_power_rating_id,
            r.season,
            r.week,
            r.contest_leg_id,
            r.team_id,
            r.pff_team_code,
            t.team_abbr,
            t.team_name,
            t.team_nick,
            t.conference,
            t.division,
            r.point_spread_rating,
            r.qb_rating,
            r.sos_to_date,
            r.sos_remaining,
            r.projected_wins,
            r.make_playoffs_pct,
            r.win_division_pct,
            r.win_conference_pct,
            r.win_super_bowl_pct,
            r.source_file,
            r.imported_at
        FROM ratings.pff_power_ratings r
        JOIN reference.teams t
          ON t.team_id = r.team_id
        WHERE r.season = %s
          AND r.week = %s
          AND t.is_active = TRUE
        ORDER BY
            r.point_spread_rating DESC NULLS LAST,
            r.qb_rating DESC NULLS LAST,
            t.team_abbr ASC;
    """

    with get_connection() as conn:
        with conn.cursor(
            cursor_factory=RealDictCursor
        ) as cur:
            cur.execute(
                sql,
                (
                    season,
                    week,
                ),
            )
            rows = cur.fetchall()

    rankings = []

    for index, row in enumerate(rows, start=1):
        rankings.append(
            {
                "rank": index,
                "pff_power_rating_id": (
                    row["pff_power_rating_id"]
                ),
                "season": row["season"],
                "week": row["week"],
                "contest_leg_id": row["contest_leg_id"],
                "team_id": row["team_id"],
                "pff_team_code": row["pff_team_code"],
                "team": row["team_abbr"],
                "team_name": row["team_name"],
                "team_nick": row["team_nick"],
                "conference": row["conference"],
                "division": row["division"],
                "point_spread_rating": _number(
                    row["point_spread_rating"]
                ),
                "qb_rating": _number(
                    row["qb_rating"]
                ),
                "sos_to_date": _number(
                    row["sos_to_date"]
                ),
                "sos_remaining": _number(
                    row["sos_remaining"]
                ),
                "projected_wins": _number(
                    row["projected_wins"]
                ),
                "make_playoffs_pct": _number(
                    row["make_playoffs_pct"]
                ),
                "win_division_pct": _number(
                    row["win_division_pct"]
                ),
                "win_conference_pct": _number(
                    row["win_conference_pct"]
                ),
                "win_super_bowl_pct": _number(
                    row["win_super_bowl_pct"]
                ),
                "source_file": row["source_file"],
                "imported_at": (
                    row["imported_at"].isoformat()
                    if row["imported_at"]
                    else None
                ),
            }
        )

    latest_imported_at = None

    if rankings:
        import_values = [
            item["imported_at"]
            for item in rankings
            if item["imported_at"] is not None
        ]

        if import_values:
            latest_imported_at = max(import_values)

    return {
        "season": season,
        "week": week,
        "count": len(rankings),
        "source": "PFF",
        "latest_imported_at": latest_imported_at,
        "rankings": rankings,
    }
