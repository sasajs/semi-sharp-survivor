from fastapi import APIRouter
from app.services.analytics_service import get_weekly_win_probs
from app.db import get_connection

router = APIRouter(prefix="/risk", tags=["Risk"])

@router.get("/methodology")
def get_methodology():
    # ... existing implementation ...
    pass

@router.get("/game/{game_id}")
def get_game_risk(game_id: str):
    # ... existing implementation ...
    pass

@router.get("/{season}/{week}")
@router.get("/week/{season}/{week}")
def get_risks(season: int, week: int):
    # ... existing implementation ...
    pass

@router.get("/probabilities/{season}/{week}")
def get_probabilities(season: int, week: int):
    return {
        "season": season,
        "week": week,
        "data": get_weekly_win_probs(season, week)
    }
