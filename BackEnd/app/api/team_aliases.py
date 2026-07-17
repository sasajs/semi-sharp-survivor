from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from psycopg2 import IntegrityError

from app.db import get_connection


router = APIRouter(
    prefix="/team-aliases",
    tags=["Team Aliases"],
)


class TeamAliasCreate(BaseModel):
    team_id: int = Field(gt=0)
    source_system: str = Field(min_length=1, max_length=50)
    alias_value: str = Field(min_length=1, max_length=200)
    alias_type: str = Field(min_length=1, max_length=50)


class TeamAliasStatusUpdate(BaseModel):
    is_active: bool


def normalize_alias(value: str) -> str:
    return " ".join(value.strip().upper().split())


@router.get("")
def get_team_aliases(
    team_id: Optional[int] = Query(default=None, gt=0),
    source_system: Optional[str] = Query(default=None),
    active_only: bool = Query(default=False),
    search: Optional[str] = Query(default=None),
):
    filters = []
    params = []

    if team_id is not None:
        filters.append("a.team_id = %s")
        params.append(team_id)

    if source_system:
        filters.append("UPPER(a.source_system) = UPPER(%s)")
        params.append(source_system.strip())

    if active_only:
        filters.append("a.is_active = TRUE")

    if search:
        filters.append(
            """
            (
                a.alias_value ILIKE %s
                OR a.alias_normalized ILIKE %s
                OR t.team_abbr ILIKE %s
                OR t.team_name ILIKE %s
            )
            """
        )
        pattern = f"%{search.strip()}%"
        params.extend([pattern, pattern, pattern, pattern])

    where_clause = ""
    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    sql = f"""
        SELECT
            a.alias_id,
            a.team_id,
            t.team_abbr,
            t.team_name,
            a.source_system,
            a.alias_value,
            a.alias_normalized,
            a.alias_type,
            a.is_active,
            a.created_at
        FROM reference.team_aliases a
        JOIN reference.teams t
          ON t.team_id = a.team_id
        {where_clause}
        ORDER BY
            t.team_abbr,
            a.source_system,
            a.alias_value;
    """

    aliases = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)

            for row in cur.fetchall():
                aliases.append({
                    "alias_id": row[0],
                    "team_id": row[1],
                    "team_abbr": row[2],
                    "team_name": row[3],
                    "source_system": row[4],
                    "alias_value": row[5],
                    "alias_normalized": row[6],
                    "alias_type": row[7],
                    "is_active": row[8],
                    "created_at": row[9],
                })

    return {
        "count": len(aliases),
        "aliases": aliases,
    }


@router.post("", status_code=201)
def create_team_alias(payload: TeamAliasCreate):
    source_system = payload.source_system.strip().upper()
    alias_value = payload.alias_value.strip()
    alias_normalized = normalize_alias(alias_value)
    alias_type = payload.alias_type.strip().upper()

    team_sql = """
        SELECT team_id, team_abbr, team_name
        FROM reference.teams
        WHERE team_id = %s;
    """

    conflict_sql = """
        SELECT
            a.alias_id,
            a.team_id,
            t.team_abbr,
            t.team_name,
            a.source_system,
            a.alias_value
        FROM reference.team_aliases a
        JOIN reference.teams t
          ON t.team_id = a.team_id
        WHERE a.alias_normalized = %s
          AND a.is_active = TRUE
          AND a.team_id <> %s
        ORDER BY a.source_system, a.alias_id;
    """

    insert_sql = """
        INSERT INTO reference.team_aliases (
            team_id,
            source_system,
            alias_value,
            alias_normalized,
            alias_type,
            is_active
        )
        VALUES (%s, %s, %s, %s, %s, TRUE)
        RETURNING
            alias_id,
            team_id,
            source_system,
            alias_value,
            alias_normalized,
            alias_type,
            is_active,
            created_at;
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(team_sql, (payload.team_id,))
                team = cur.fetchone()

                if team is None:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Team ID {payload.team_id} was not found.",
                    )

                cur.execute(
                    conflict_sql,
                    (
                        alias_normalized,
                        payload.team_id,
                    ),
                )
                conflicts = cur.fetchall()

                if conflicts:
                    conflict = conflicts[0]
                    raise HTTPException(
                        status_code=409,
                        detail={
                            "message": (
                                f"Alias '{alias_value}' already resolves to "
                                f"a different team."
                            ),
                            "existing_alias_id": conflict[0],
                            "existing_team_id": conflict[1],
                            "existing_team_abbr": conflict[2],
                            "existing_team_name": conflict[3],
                            "existing_source_system": conflict[4],
                            "existing_alias_value": conflict[5],
                        },
                    )

                cur.execute(
                    insert_sql,
                    (
                        payload.team_id,
                        source_system,
                        alias_value,
                        alias_normalized,
                        alias_type,
                    ),
                )
                row = cur.fetchone()

            conn.commit()

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Alias '{alias_value}' already exists for "
                f"source system '{source_system}'."
            ),
        )

    return {
        "alias_id": row[0],
        "team_id": row[1],
        "team_abbr": team[1],
        "team_name": team[2],
        "source_system": row[2],
        "alias_value": row[3],
        "alias_normalized": row[4],
        "alias_type": row[5],
        "is_active": row[6],
        "created_at": row[7],
    }



@router.get("/sources")
def get_team_alias_sources():
    sql = """
        SELECT
            source_system,
            COUNT(*) AS total_count,
            COUNT(*) FILTER (
                WHERE is_active = TRUE
            ) AS active_count,
            COUNT(*) FILTER (
                WHERE is_active = FALSE
            ) AS inactive_count
        FROM reference.team_aliases
        GROUP BY source_system
        ORDER BY source_system;
    """

    sources = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)

            for row in cur.fetchall():
                sources.append({
                    "source_system": row[0],
                    "total_count": row[1],
                    "active_count": row[2],
                    "inactive_count": row[3],
                })

    return {
        "count": len(sources),
        "sources": sources,
    }


@router.patch("/{alias_id}/status")
def update_team_alias_status(
    alias_id: int,
    payload: TeamAliasStatusUpdate,
):
    sql = """
        UPDATE reference.team_aliases
        SET is_active = %s
        WHERE alias_id = %s
        RETURNING
            alias_id,
            team_id,
            source_system,
            alias_value,
            alias_normalized,
            alias_type,
            is_active,
            created_at;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (payload.is_active, alias_id))
            row = cur.fetchone()

            if row is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Alias ID {alias_id} was not found.",
                )

        conn.commit()

    return {
        "alias_id": row[0],
        "team_id": row[1],
        "source_system": row[2],
        "alias_value": row[3],
        "alias_normalized": row[4],
        "alias_type": row[5],
        "is_active": row[6],
        "created_at": row[7],
    }


@router.get("/resolve")
def resolve_team_alias(
    alias_value: str = Query(min_length=1),
    source_system: Optional[str] = Query(default=None),
):
    normalized = normalize_alias(alias_value)

    filters = [
        "a.alias_normalized = %s",
        "a.is_active = TRUE",
    ]
    params = [normalized]

    if source_system:
        filters.append("UPPER(a.source_system) = UPPER(%s)")
        params.append(source_system.strip())

    sql = f"""
        SELECT
            a.alias_id,
            a.source_system,
            a.alias_value,
            a.alias_type,
            t.team_id,
            t.team_abbr,
            t.team_name
        FROM reference.team_aliases a
        JOIN reference.teams t
          ON t.team_id = a.team_id
        WHERE {" AND ".join(filters)}
        ORDER BY a.source_system, a.alias_id;
    """

    matches = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)

            for row in cur.fetchall():
                matches.append({
                    "alias_id": row[0],
                    "source_system": row[1],
                    "alias_value": row[2],
                    "alias_type": row[3],
                    "team_id": row[4],
                    "team_abbr": row[5],
                    "team_name": row[6],
                })

    if not matches:
        raise HTTPException(
            status_code=404,
            detail=f"No active alias matched '{alias_value}'.",
        )

    team_ids = {match["team_id"] for match in matches}

    return {
        "resolved": len(team_ids) == 1,
        "ambiguous": len(team_ids) > 1,
        "match_count": len(matches),
        "matches": matches,
    }
