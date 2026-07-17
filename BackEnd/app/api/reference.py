from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.reference_service import (
    ReferenceDataError,
    get_home_field_advantage,
    update_home_field_advantage,
)


router = APIRouter(
    prefix="/reference",
    tags=["Reference Data"],
)


class HomeFieldAdvantageUpdate(BaseModel):
    home_field_points: float = Field(ge=-10, le=10)
    notes: str | None = Field(default=None, max_length=1000)


@router.get("/home-field-advantage/{season}")
def home_field_advantage(
    season: int,
):
    """
    Return active team-level home-field advantage values
    for one season.
    """
    try:
        return get_home_field_advantage(
            season=season,
        )

    except ReferenceDataError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

@router.patch("/home-field-advantage/{season}/{team_id}")
def patch_home_field_advantage(
    season: int,
    team_id: int,
    payload: HomeFieldAdvantageUpdate,
):
    """
    Update one team's active HFA value for one NFL season.
    """
    try:
        return update_home_field_advantage(
            season=season,
            team_id=team_id,
            home_field_points=payload.home_field_points,
            notes=payload.notes,
        )

    except ReferenceDataError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

