from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.ratings_service import (
    RatingsError,
    get_pff_power_rankings,
)


router = APIRouter(
    prefix="/ratings",
    tags=["Ratings"],
)


@router.get("/pff/{season}/{week}")
def pff_power_rankings(
    season: int,
    week: int,
):
    """
    Return PFF power rankings for one season and rating week.

    Rankings are ordered by point-spread rating descending.
    """
    try:
        return get_pff_power_rankings(
            season=season,
            week=week,
        )

    except RatingsError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
