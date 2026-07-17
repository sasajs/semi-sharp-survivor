from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.admin_auth import require_admin
from app.services.sic_scores_import_service import (
    SicScoresImportError,
    import_sic_scores,
    validate_sic_scores,
)


router = APIRouter(
    prefix="/admin/injuries",
    tags=["Administration"],
    dependencies=[Depends(require_admin)],
)


class SicScoresImportRequest(BaseModel):
    season: int = Field(
        ge=2000,
        le=2100,
    )
    week: int = Field(
        ge=1,
        le=22,
    )
    replace_existing: bool = False


@router.get("/sic/validate")
def validate_sic_input():
    try:
        return validate_sic_scores()

    except SicScoresImportError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@router.post("/sic/import")
def import_sic_input(
    payload: SicScoresImportRequest,
):
    try:
        return import_sic_scores(
            season=payload.season,
            week=payload.week,
            replace_existing=payload.replace_existing,
        )

    except SicScoresImportError as exc:
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
