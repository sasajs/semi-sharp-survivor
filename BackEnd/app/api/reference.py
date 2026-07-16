from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.reference_service import (
    ReferenceDataError,
    get_home_field_advantage,
)


router = APIRouter(
    prefix="/reference",
    tags=["Reference Data"],
)


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
