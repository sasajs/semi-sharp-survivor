from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from psycopg2 import IntegrityError

from app.db import get_connection


router = APIRouter(
    prefix="/admin/entries",
    tags=["Admin Entries"],
)


class EntryCreateRequest(BaseModel):
    user_id: int
    survivor_sweat_name: str = Field(min_length=1, max_length=100)
    entry_label: str = Field(min_length=1, max_length=100)
    contest_format_id: int
    is_active: bool = True


class EntryUpdateRequest(BaseModel):
    user_id: int | None = None
    survivor_sweat_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    entry_label: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    contest_format_id: int | None = None
    is_active: bool | None = None


def _rows_as_dicts(cursor: Any) -> list[dict[str, Any]]:
    columns = [description[0] for description in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _row_as_dict(cursor: Any, row: tuple[Any, ...]) -> dict[str, Any]:
    columns = [description[0] for description in cursor.description]
    return dict(zip(columns, row))


@router.get("/")
def list_entries(
    db = Depends(get_connection),
) -> list[dict[str, Any]]:
    query = """
        SELECT
            ue.entry_id,
            ue.user_id,
            ue.username,
            ue.display_name,
            ue.role,
            ue.survivor_sweat_name,
            ue.entry_label,
            ue.entry_is_active AS is_active,
            ue.contest_format_id,
            ue.format_code,
            ue.format_name
        FROM survivor.user_entries ue
        WHERE ue.entry_id IS NOT NULL
        ORDER BY ue.user_id, ue.entry_id
    """

    try:
        with db.cursor() as cursor:
            cursor.execute(query)
            return _rows_as_dicts(cursor)
    finally:
        db.close()


@router.post("/", status_code=201)
def create_entry(
    payload: EntryCreateRequest,
    db = Depends(get_connection),
) -> dict[str, Any]:
    validation_query = """
        SELECT
            EXISTS (
                SELECT 1
                FROM auth.users
                WHERE user_id = %s
                  AND is_active = TRUE
            ) AS valid_user,
            EXISTS (
                SELECT 1
                FROM contest.formats
                WHERE contest_format_id = %s
                  AND is_active = TRUE
            ) AS valid_format
    """

    insert_query = """
        INSERT INTO survivor.entries (
            user_id,
            survivor_sweat_name,
            entry_label,
            is_active,
            contest_format_id
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING
            entry_id,
            user_id,
            survivor_sweat_name,
            entry_label,
            is_active,
            contest_format_id,
            created_at
    """

    try:
        with db.cursor() as cursor:
            cursor.execute(
                validation_query,
                (payload.user_id, payload.contest_format_id),
            )
            valid_user, valid_format = cursor.fetchone()

            if not valid_user:
                raise HTTPException(
                    status_code=400,
                    detail="The selected user does not exist or is inactive.",
                )

            if not valid_format:
                raise HTTPException(
                    status_code=400,
                    detail="The selected contest format does not exist or is inactive.",
                )

            cursor.execute(
                insert_query,
                (
                    payload.user_id,
                    payload.survivor_sweat_name.strip(),
                    payload.entry_label.strip(),
                    payload.is_active,
                    payload.contest_format_id,
                ),
            )

            result = _row_as_dict(cursor, cursor.fetchone())
            db.commit()
            return result

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An entry with that Survivor Sweat name already exists.",
        ) from exc
    finally:
        db.close()


@router.patch("/{entry_id}")
def update_entry(
    entry_id: int,
    payload: EntryUpdateRequest,
    db = Depends(get_connection),
) -> dict[str, Any]:
    updates: list[str] = []
    values: list[Any] = []

    update_fields = payload.model_dump(exclude_unset=True)

    allowed_columns = {
        "user_id": "user_id",
        "survivor_sweat_name": "survivor_sweat_name",
        "entry_label": "entry_label",
        "contest_format_id": "contest_format_id",
        "is_active": "is_active",
    }

    for field_name, value in update_fields.items():
        column_name = allowed_columns[field_name]

        if isinstance(value, str):
            value = value.strip()

        updates.append(f"{column_name} = %s")
        values.append(value)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No entry fields were supplied for update.",
        )

    query = f"""
        UPDATE survivor.entries
        SET {", ".join(updates)}
        WHERE entry_id = %s
        RETURNING
            entry_id,
            user_id,
            survivor_sweat_name,
            entry_label,
            is_active,
            contest_format_id,
            eliminated_leg_id,
            eliminated_at,
            eliminated_reason,
            created_at
    """

    values.append(entry_id)

    try:
        with db.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()

            if row is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Entry {entry_id} was not found.",
                )

            result = _row_as_dict(cursor, row)
            db.commit()
            return result

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="The requested entry update violates a database constraint.",
        ) from exc
    finally:
        db.close()


@router.delete("/{entry_id}")
def delete_entry(
    entry_id: int,
    db = Depends(get_connection),
) -> dict[str, Any]:
    usage_query = """
        SELECT COUNT(*)
        FROM survivor.entry_picks
        WHERE entry_id = %s
    """

    delete_query = """
        DELETE FROM survivor.entries
        WHERE entry_id = %s
        RETURNING entry_id, survivor_sweat_name
    """

    try:
        with db.cursor() as cursor:
            cursor.execute(usage_query, (entry_id,))
            pick_count = cursor.fetchone()[0]

            if pick_count > 0:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This entry already has pick history and cannot be deleted. "
                        "Set the entry to inactive instead."
                    ),
                )

            cursor.execute(delete_query, (entry_id,))
            row = cursor.fetchone()

            if row is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Entry {entry_id} was not found.",
                )

            db.commit()

            return {
                "status": "deleted",
                "entry_id": row[0],
                "survivor_sweat_name": row[1],
            }

    except HTTPException:
        db.rollback()
        raise
    finally:
        db.close()
