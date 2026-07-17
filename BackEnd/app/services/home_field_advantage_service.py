from __future__ import annotations

from app.db import get_connection


class HomeFieldAdvantageError(ValueError):
    """Raised when HFA reference data is incomplete or ambiguous."""


def get_current_hfa_source(season: int) -> str:
    """
    Return the single active, complete HFA source for an NFL season.

    A valid current source must:
    - exist in reference.home_field_advantage;
    - contain exactly one active row for every active NFL team;
    - be the only complete active source for the requested season.
    """
    if season < 2000 or season > 2100:
        raise HomeFieldAdvantageError(
            "Season must be between 2000 and 2100."
        )

    sql = """
        WITH active_team_count AS (
            SELECT COUNT(*)::integer AS team_count
            FROM reference.teams
            WHERE is_active = TRUE
        ),
        source_counts AS (
            SELECT
                h.source_system,
                COUNT(DISTINCT h.team_id)::integer AS team_count
            FROM reference.home_field_advantage h
            JOIN reference.teams t
              ON t.team_id = h.team_id
             AND t.is_active = TRUE
            WHERE h.season = %s
              AND h.is_active = TRUE
            GROUP BY h.source_system
        )
        SELECT
            s.source_system,
            s.team_count,
            a.team_count AS expected_team_count
        FROM source_counts s
        CROSS JOIN active_team_count a
        WHERE s.team_count = a.team_count
        ORDER BY s.source_system;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season,))
            rows = cur.fetchall()

    if not rows:
        raise HomeFieldAdvantageError(
            f"No complete active HFA source exists for season {season}."
        )

    if len(rows) > 1:
        sources = ", ".join(row[0] for row in rows)

        raise HomeFieldAdvantageError(
            f"Multiple complete active HFA sources exist for season "
            f"{season}: {sources}."
        )

    return str(rows[0][0])


def get_current_hfa_values(
    season: int,
) -> dict[int, float]:
    """
    Return active team-level HFA values for the current season source.
    """
    source_system = get_current_hfa_source(season)

    sql = """
        SELECT
            team_id,
            home_field_points
        FROM reference.home_field_advantage
        WHERE season = %s
          AND source_system = %s
          AND is_active = TRUE
        ORDER BY team_id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    season,
                    source_system,
                ),
            )
            rows = cur.fetchall()

    return {
        int(team_id): float(home_field_points)
        for team_id, home_field_points in rows
    }
