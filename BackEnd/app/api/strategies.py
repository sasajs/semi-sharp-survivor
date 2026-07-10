from fastapi import APIRouter, Query
from app.services import strategy_service
from app.db import get_connection

router = APIRouter(prefix="/strategies", tags=["Strategies"])

@router.get("")
def get_strategies():
    """
    Retrieves the list of available strategies from the strategy.registry table.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    strategy_code, 
                    display_name, 
                    description, 
                    endpoint, 
                    runtime_class, 
                    requires_background_job, 
                    parameters 
                FROM strategy.registry 
                WHERE is_active = TRUE;
            """)
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]


@router.get("/current-week-highest-win/{season}/{contest_format}")
def current_week_highest_win(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.current_week_highest_win(season, contest_format, rating_week, hfa_source)


@router.get("/future-value/{season}/{contest_format}")
def future_value(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.future_value(season, contest_format, rating_week, hfa_source)


@router.get("/multiple-entry/{season}/{contest_format}")
def multiple_entry(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.multiple_entry(season, contest_format, rating_week, hfa_source)


@router.get("/circa-holiday/{season}")
def circa_holiday(
    season: int,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.circa_holiday(season, rating_week, hfa_source)


@router.get("/projection-edge/{season}/{contest_format}")
def projection_edge(
    season: int,
    contest_format: str
):
    return strategy_service.projection_edge(season, contest_format)


@router.get("/monte-carlo/{season}/{contest_format}")
def monte_carlo(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.monte_carlo(season, contest_format, rating_week, hfa_source)


@router.get("/dynamic-programming/{season}/{contest_format}")
def dynamic_programming(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.dynamic_programming(season, contest_format, rating_week, hfa_source)


@router.get("/bottom-six-road-fade/{season}/{contest_format}")
def bottom_six_road_fade(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.bottom_six_road_fade(season, contest_format, rating_week, hfa_source)


@router.get("/market-arbitrage-exit/{season}/{contest_format}")
def market_arbitrage_exit(
    season: int,
    contest_format: str,
    rating_week: int = Query(1),
    hfa_source: str = Query("SEMISHARP_2026")
):
    return strategy_service.market_arbitrage_exit(season, contest_format, rating_week, hfa_source)
