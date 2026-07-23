from __future__ import annotations

"""
FastAPI routes for SemiSharp in-season management.

The frontend must not infer valid teams, used teams, current-week
readiness, or contest-leg mappings. It reads and submits backend-owned
data only.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.admin_auth import require_admin
from app.services.season_management_service import (
    SeasonManagementError,
    advance_current_week,
    create_entry_pick,
    delete_entry_pick,
    get_entry_review,
    get_season_management_status,
    list_entry_picks,
    list_valid_pick_options,
    update_entry_pick,
)


router = APIRouter(
    prefix="/season-management",
    tags=["Season Management"],
)


class EntryPickCreate(BaseModel):
    contest_leg_id: int = Field(ge=1)
    team_id: int = Field(ge=1)
    pick_source: str = "USER_ENTRY"
    pick_status: str = "CONFIRMED"
    notes: str | None = None
    updated_by_user_id: int | None = Field(
        default=None,
        ge=1,
    )
    change_reason: str | None = None


class EntryPickUpdate(BaseModel):
    team_id: int = Field(ge=1)
    pick_source: str = "ADMIN_CORRECTION"
    pick_status: str = "CONFIRMED"
    notes: str | None = None
    updated_by_user_id: int | None = Field(
        default=None,
        ge=1,
    )
    change_reason: str


class EntryPickDelete(BaseModel):
    updated_by_user_id: int | None = Field(
        default=None,
        ge=1,
    )
    change_reason: str


class CurrentWeekUpdate(BaseModel):
    season: int = Field(ge=2000, le=2100)
    current_week: int = Field(ge=1, le=22)
    rating_week: int = Field(ge=1, le=22)
    allow_backward: bool = False


def _raise_http_error(exc: Exception) -> None:
    raise HTTPException(
        status_code=422,
        detail=str(exc),
    ) from exc


@router.get("/status")
def season_management_status():
    """
    Return active season context and entry-history readiness.
    """
    try:
        return get_season_management_status()

    except SeasonManagementError as exc:
        _raise_http_error(exc)


@router.get("/entries/{entry_id}/review")
def entry_review(entry_id: int):
    """
    Return the complete Step 1 entry-review model.
    """
    try:
        return get_entry_review(entry_id)

    except SeasonManagementError as exc:
        _raise_http_error(exc)


@router.get("/entries/{entry_id}/picks")
def entry_picks(entry_id: int):
    """
    Return the official stored picks for one survivor entry.
    """
    try:
        return {
            "entry_id": entry_id,
            "picks": list_entry_picks(entry_id),
        }

    except SeasonManagementError as exc:
        _raise_http_error(exc)


@router.get(
    "/entries/{entry_id}/valid-picks/{contest_leg_id}"
)
def valid_pick_options(
    entry_id: int,
    contest_leg_id: int,
):
    """
    Return backend-validated team options for one contest leg.

    Used teams remain visible but are marked ineligible.
    """
    try:
        return list_valid_pick_options(
            entry_id=entry_id,
            contest_leg_id=contest_leg_id,
        )

    except SeasonManagementError as exc:
        _raise_http_error(exc)


@router.post(
    "/entries/{entry_id}/picks",
    status_code=201,
)
def create_pick(
    entry_id: int,
    payload: EntryPickCreate,
):
    """
    Create one official survivor pick.
    """
    try:
        return create_entry_pick(
            entry_id=entry_id,
            contest_leg_id=payload.contest_leg_id,
            team_id=payload.team_id,
            pick_source=payload.pick_source,
            pick_status=payload.pick_status,
            notes=payload.notes,
            updated_by_user_id=(
                payload.updated_by_user_id
            ),
            change_reason=payload.change_reason,
        )

    except SeasonManagementError as exc:
        _raise_http_error(exc)


@router.put(
    "/entries/{entry_id}/picks/{contest_leg_id}"
)
def correct_pick(
    entry_id: int,
    contest_leg_id: int,
    payload: EntryPickUpdate,
):
    """
    Correct an existing official pick.

    The old value remains in immutable audit history.
    """
    try:
        return update_entry_pick(
            entry_id=entry_id,
            contest_leg_id=contest_leg_id,
            team_id=payload.team_id,
            pick_source=payload.pick_source,
            pick_status=payload.pick_status,
            notes=payload.notes,
            updated_by_user_id=(
                payload.updated_by_user_id
            ),
            change_reason=payload.change_reason,
        )

    except SeasonManagementError as exc:
        _raise_http_error(exc)


@router.delete(
    "/entries/{entry_id}/picks/{contest_leg_id}"
)
def remove_pick(
    entry_id: int,
    contest_leg_id: int,
    payload: EntryPickDelete,
):
    """
    Delete an incorrect current pick while preserving audit history.
    """
    try:
        return delete_entry_pick(
            entry_id=entry_id,
            contest_leg_id=contest_leg_id,
            updated_by_user_id=(
                payload.updated_by_user_id
            ),
            change_reason=payload.change_reason,
        )

    except SeasonManagementError as exc:
        _raise_http_error(exc)


@router.put(
    "/current-week",
    dependencies=[Depends(require_admin)],
)
def update_current_week(
    payload: CurrentWeekUpdate,
):
    """
    Advance the active regular NFL week.

    Prior regular-week picks must exist for every active entry.
    """
    try:
        return advance_current_week(
            season=payload.season,
            current_week=payload.current_week,
            rating_week=payload.rating_week,
            allow_backward=payload.allow_backward,
        )

    except SeasonManagementError as exc:
        _raise_http_error(exc)
