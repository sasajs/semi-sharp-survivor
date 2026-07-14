"""
Repository for retrieving analytical data from the PostgreSQL database.
This layer handles all direct database communication for analytical metrics.
"""
from app.db import get_connection

def get_win_probabilities(season: int, week: int):
    """
    Retrieves win probabilities and risk-adjusted win probabilities 
    for all teams in a specified season and week.
    """
    sql = """
        SELECT 
            game_id, 
            team_id, 
            baseline_wp, 
            risk_adjusted_wp, 
            risk_discount_factor
        FROM analytics.game_win_probabilities
        WHERE season = %s AND week = %s
        ORDER BY game_id, team_id;
    """
    
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))
            
            # Fetch column names to return structured dictionaries
            columns = [desc[0] for desc in cur.description]
            
            # Return list of dictionaries for clean JSON serialization in API layer
            return [dict(zip(columns, row)) for row in cur.fetchall()]
