"""
Service layer for analytical decision support.
This layer provides a clean interface for API routes to consume analytical metrics.
"""
from app.repositories.analytics_repository import get_win_probabilities

def get_weekly_win_probs(season: int, week: int):
    """
    Orchestrates the retrieval of win probabilities for the requested week.
    Future business logic (formatting, filtering, or combining models) 
    should be implemented here.
    """
    return get_win_probabilities(season, week)
