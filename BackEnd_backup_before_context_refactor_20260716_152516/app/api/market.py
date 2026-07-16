from fastapi import APIRouter

from app.db import get_connection


router = APIRouter(prefix="/market", tags=["Market"])


@router.get("/consensus/{season}/{week}")
def get_consensus(season: int, week: int):

    sql = """
        SELECT
            c.game_id,
            t.team_abbr,
            c.consensus_spread,
            c.sportsbook_count,
            c.latest_snapshot
        FROM market.consensus_spreads c
        JOIN reference.teams t
          ON t.team_id = c.team_id
        WHERE c.season = %s
          AND c.week = %s
        ORDER BY c.game_id, c.consensus_spread;
    """

    lines = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))

            for row in cur.fetchall():
                lines.append({
                    "game_id": row[0],
                    "team": row[1],
                    "consensus_spread": float(row[2]),
                    "sportsbook_count": row[3],
                    "latest_snapshot": str(row[4])
                })

    return {
        "season": season,
        "week": week,
        "count": len(lines),
        "consensus_lines": lines
    }


@router.get("/projection-edge/{season}/{week}")
def get_projection_edge(season: int, week: int):

    sql = """
        SELECT
            game_id,
            team_abbr,
            semisharp_spread,
            market_spread,
            edge_points,
            sportsbook_count
        FROM market.projection_edges
        WHERE season = %s
          AND week = %s
        ORDER BY edge_points DESC;
    """

    edges = []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (season, week))

            for row in cur.fetchall():
                edges.append({
                    "game_id": row[0],
                    "team": row[1],
                    "semisharp_spread": float(row[2]),
                    "market_spread": float(row[3]),
                    "edge_points": float(row[4]),
                    "sportsbook_count": row[5]
                })

    return {
        "season": season,
        "week": week,
        "count": len(edges),
        "projection_edges": edges
    }
