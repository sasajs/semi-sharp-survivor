from fastapi import APIRouter

from app.services import strategy_service


router = APIRouter(prefix="/strategies", tags=["Strategies"])


@router.get("/highest-win/{season}/{contest_format}")
def highest_win(
    season: int,
    contest_format: str,
    rating_week: int = 1,
    hfa_source: str = "SEMISHARP_2026"
):
    return strategy_service.highest_win_probability(
        season,
        contest_format,
        rating_week,
        hfa_source
    )


@router.get("/future-value/{season}/{contest_format}")
def future_value(
    season: int,
    contest_format: str,
    rating_week: int = 1,
    hfa_source: str = "SEMISHARP_2026"
):
    return strategy_service.future_value(
        season,
        contest_format,
        rating_week,
        hfa_source
    )


@router.get("/multiple-entry/{season}/{contest_format}")
def multiple_entry(
    season: int,
    contest_format: str,
    rating_week: int = 1,
    hfa_source: str = "SEMISHARP_2026"
):
    return strategy_service.multiple_entry(
        season,
        contest_format,
        rating_week,
        hfa_source
    )


@router.get("/circa-holiday/{season}")
def circa_holiday(season: int):
    return strategy_service.circa_holiday(
        season
    )


@router.get("/projection-edge/{season}/{contest_format}")
def projection_edge(
    season: int,
    contest_format: str
):
    return strategy_service.projection_edge(
        season,
        contest_format
    )


@router.get("/monte-carlo/{season}/{contest_format}")
def monte_carlo(
    season: int,
    contest_format: str,
    rating_week: int = 1,
    hfa_source: str = "SEMISHARP_2026"
):
    return strategy_service.monte_carlo(
        season,
        contest_format,
        rating_week,
        hfa_source
    )


@router.get("/dynamic-programming/{season}/{contest_format}")
def dynamic_programming(
    season: int,
    contest_format: str,
    rating_week: int = 1,
    hfa_source: str = "SEMISHARP_2026"
):
    return strategy_service.dynamic_programming(
        season,
        contest_format,
        rating_week,
        hfa_source
    )
