from fastapi import APIRouter, HTTPException, Query

from app.services.strategy_context_service import (
    StrategyContextError,
    build_strategy_context,
)


router = APIRouter(
    prefix="/strategy-context",
    tags=["Strategy Context"],
)


@router.get("/{entry_id}")
def get_strategy_context(
    entry_id: int,
    contest_format: str = Query(...),
    contest_leg_id: int | None = Query(None),
):
    try:
        context = build_strategy_context(
            entry_id=entry_id,
            contest_format=contest_format,
            contest_leg_id=contest_leg_id,
        )
        return context.to_dict()

    except StrategyContextError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
