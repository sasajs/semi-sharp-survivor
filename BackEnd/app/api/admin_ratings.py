from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.admin_auth import require_admin
from app.services.pff_power_ratings_import_service import (
    PffPowerRatingsImportError,
    import_pff_power_ratings,
    validate_pff_power_ratings,
)


router = APIRouter(
    prefix="/admin/ratings",
    tags=["Administration"],
    dependencies=[Depends(require_admin)],
)


class PffPowerRatingsImportRequest(BaseModel):
    season: int = Field(
        ge=2000,
        le=2100,
    )
    week: int = Field(
        ge=1,
        le=22,
    )
    replace_existing: bool = False


@router.get("/pff/validate")
def validate_pff_input():
    try:
        return validate_pff_power_ratings()

    except PffPowerRatingsImportError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@router.post("/pff/import")
def import_pff_input(
    payload: PffPowerRatingsImportRequest,
):
    try:
        return import_pff_power_ratings(
            season=payload.season,
            week=payload.week,
            replace_existing=payload.replace_existing,
        )

    except PffPowerRatingsImportError as exc:
        message = str(exc)

        status_code = (
            409
            if "already contains" in message
            else 422
        )

        raise HTTPException(
            status_code=status_code,
            detail=message,
        ) from exc
