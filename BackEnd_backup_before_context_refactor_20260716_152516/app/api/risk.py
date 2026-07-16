from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/risk", tags=["Risk"])


@router.get("/methodology")
def get_methodology():

    return {
        "version": "Risk Engine V3",
        "description": (
            "SemiSharp Risk Ratings identify games where projected favorites "
            "have elevated upset risk based on historical NFL analysis and "
            "current matchup conditions."
        ),
        "historical_basis": {
            "seasons": "2015-2025",
            "games_analyzed": 3028,
            "baseline_upset_rate": 34.08
        },
        "primary_factors": [
            {
                "name": "Favorite Spread",
                "description": (
                    "Historical analysis shows smaller favorites are "
                    "significantly more likely to lose."
                )
            },
            {
                "name": "Away Favorite",
                "description": (
                    "Road favorites receive a small risk adjustment."
                )
            },
            {
                "name": "Quarterback Quality",
                "description": (
                    "Quarterback quality differences can increase upset risk."
                )
            },
            {
                "name": "Team Strength",
                "description": (
                    "Underlying team strength differences are considered."
                )
            },
            {
                "name": "Injury Impact",
                "description": (
                    "Current injury information is incorporated when available."
                )
            }
        ]
    }


@router.get("/game/{game_id}")
def get_game_risk(game_id: str):

    sql = """
        SELECT
            r.game_id,
            t.team_abbr,
            r.total_risk_points,
            r.risk_factor_count,
            r.risk_types
        FROM risk.game_risk_summary r
        JOIN reference.teams t
          ON t.team_id = r.team_id
        WHERE r.game_id = %s;
    """

    risks = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (game_id,))

            for row in cur.fetchall():
                risks.append({
                    "game_id": row[0],
                    "team": row[1],
                    "risk_points": float(row[2]),
                    "risk_factor_count": row[3],
                    "risk_types": row[4]
                })

    return {
        "game_id": game_id,
        "risks": risks
    }


@router.get("/{season}/{week}")
@router.get("/week/{season}/{week}")
def get_risks(season: int, week: int):

    sql = """
        SELECT
            r.game_id,
            t.team_abbr,
            r.total_risk_points,
            r.risk_factor_count,
            r.risk_types
        FROM risk.game_risk_summary r
        JOIN reference.teams t
          ON t.team_id = r.team_id
        WHERE r.season = %s
          AND r.week = %s
        ORDER BY r.total_risk_points DESC;
    """

    risks = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))

            for row in cur.fetchall():
                risks.append({
                    "game_id": row[0],
                    "team": row[1],
                    "risk_points": float(row[2]),
                    "risk_factor_count": row[3],
                    "risk_types": row[4]
                })

    return {
        "season": season,
        "week": week,
        "count": len(risks),
        "risks": risks
    }
