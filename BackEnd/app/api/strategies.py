from fastapi import APIRouter, HTTPException, Query

from app.db import get_connection
from app.services import strategy_service
from app.services.compare_strategies_service import (
    CompareStrategiesError,
    compare_strategies,
)


# main.py supplies the /strategies prefix.
router = APIRouter(tags=["Strategies"])


@router.get("")
def get_strategies():
    """
    Return active strategies advertised by the backend registry.

    The frontend must treat this registry as authoritative and must not
    invent or display inactive strategies.
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    strategy_code,
                    display_name,
                    description,
                    endpoint,
                    runtime_class,
                    requires_background_job,
                    parameters
                FROM strategy.registry
                WHERE is_active = TRUE
                ORDER BY display_name;
                """
            )

            columns = [
                description[0]
                for description in cursor.description
            ]

            return [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]


@router.get(
    "/current-week-highest-win/{season}/{contest_format}"
)
def current_week_highest_win(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
    entry_id: int = Query(1),
):
    return strategy_service.current_week_highest_win(
        season,
        contest_format,
        rating_week,
        hfa_source,
        entry_id,
    )


@router.get("/future-value/{season}/{contest_format}")
def future_value(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
    entry_id: int = Query(1),
):
    return strategy_service.future_value(
        season,
        contest_format,
        rating_week,
        hfa_source,
        entry_id,
    )


@router.get("/multiple-entry/{season}/{contest_format}")
def multiple_entry(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
    user_id: int = Query(1),
):
    return strategy_service.multiple_entry(
        season,
        contest_format,
        rating_week,
        hfa_source,
        user_id,
    )


@router.get("/circa-holiday/{season}")
def circa_holiday(
    season: int,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
):
    return strategy_service.circa_holiday(
        season,
        rating_week,
        hfa_source,
    )


@router.get("/projection-edge/{season}/{contest_format}")
def projection_edge(
    season: int,
    contest_format: str,
):
    return strategy_service.projection_edge(
        season,
        contest_format,
    )


@router.get("/monte-carlo/{season}/{contest_format}")
def monte_carlo(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
    entry_id: int | None = Query(None, ge=1),
):
    return strategy_service.monte_carlo(
        season,
        contest_format,
        rating_week,
        hfa_source,
        entry_id,
    )


@router.get(
    "/dynamic-programming/{season}/{contest_format}"
)
def dynamic_programming(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
    entry_id: int | None = Query(None, ge=1),
):
    return strategy_service.dynamic_programming(
        season,
        contest_format,
        rating_week,
        hfa_source,
        entry_id,
    )


@router.get(
    "/bottom-six-road-fade/{season}/{contest_format}"
)
def bottom_six_road_fade(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
):
    return strategy_service.bottom_six_road_fade(
        season,
        contest_format,
        rating_week,
        hfa_source,
    )


@router.get(
    "/market-arbitrage-exit/{season}/{contest_format}"
)
def market_arbitrage_exit(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
):
    return strategy_service.market_arbitrage_exit(
        season,
        contest_format,
        rating_week,
        hfa_source,
    )


@router.get("/compare/{season}/{contest_format}")
def compare_strategy_paths(
    season: int,
    contest_format: str,
    rating_week: int = Query(1, ge=1, le=22),
    hfa_source: str = Query("SEMISHARP_2026_RECAL_V1"),
    entry_id: int = Query(1, ge=1),
):
    """
    Run and compare the five production season-planning strategies.

    This endpoint is computationally heavy because Dynamic Programming
    and Monte Carlo are executed during the comparison. The frontend
    must display the returned backend result without recalculating
    agreement, probabilities, rankings, or consensus.
    """
    try:
        return compare_strategies(
            season=season,
            contest_format=contest_format,
            rating_week=rating_week,
            hfa_source=hfa_source,
            entry_id=entry_id,
        )

    except CompareStrategiesError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Compare Strategies execution failed: "
                f"{exc}"
            ),
        ) from exc
        
