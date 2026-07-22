from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_connection


router = APIRouter(
    prefix="/analysis",
    tags=["Weekly Game Analysis"],
)


def serialize_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    return value


def row_to_dict(cursor, row) -> dict[str, Any]:
    columns = [description[0] for description in cursor.description]

    return {
        column: serialize_value(value)
        for column, value in zip(columns, row)
    }


@router.get("/week/{season}/{week}")
def get_weekly_game_analysis(
    season: int,
    week: int,
    db=Depends(get_connection),
):
    if season < 2000 or season > 2100:
        raise HTTPException(
            status_code=400,
            detail="Invalid season.",
        )

    if week < 1 or week > 22:
        raise HTTPException(
            status_code=400,
            detail="Week must be between 1 and 22.",
        )

    games_sql = """
        SELECT
            g.game_id,
            g.season,
            g.week,
            g.game_type,
            g.gameday,
            g.gametime,
            g.away_team_id,
            g.away_team_abbr,
            away_team.team_name AS away_team_name,
            g.home_team_id,
            g.home_team_abbr,
            home_team.team_name AS home_team_name,
            g.spread_line AS schedule_spread_line,
            g.total_line AS schedule_total_line,

            p.rating_week,
            p.away_power_rating,
            p.home_power_rating,
            p.power_rating_diff,
            p.home_field_points,
            p.projected_home_margin,
            p.projected_favorite_team_id,
            p.projected_favorite_abbr,
            p.projected_spread,
            p.source_system AS projection_source,
            p.created_at AS projection_created_at,

            away_consensus.consensus_spread
                AS away_consensus_spread,
            away_consensus.consensus_price
                AS away_consensus_price,

            home_consensus.consensus_spread
                AS home_consensus_spread,
            home_consensus.consensus_price
                AS home_consensus_price,

            GREATEST(
                COALESCE(away_consensus.sportsbook_count, 0),
                COALESCE(home_consensus.sportsbook_count, 0)
            ) AS consensus_sportsbook_count,

            GREATEST(
                away_consensus.latest_snapshot,
                home_consensus.latest_snapshot
            ) AS consensus_latest_snapshot,

            away_edge.semisharp_spread
                AS away_semisharp_spread,
            away_edge.market_spread
                AS away_market_spread,
            away_edge.edge_points
                AS away_edge_points,

            home_edge.semisharp_spread
                AS home_semisharp_spread,
            home_edge.market_spread
                AS home_market_spread,
            home_edge.edge_points
                AS home_edge_points,

            away_risk.risk_score AS away_risk_score,
            away_risk.risk_stars AS away_risk_stars,
            away_risk.risk_level AS away_risk_level,
            away_risk.factor_count AS away_risk_factor_count,
            away_risk.risk_summary AS away_risk_summary,

            home_risk.risk_score AS home_risk_score,
            home_risk.risk_stars AS home_risk_stars,
            home_risk.risk_level AS home_risk_level,
            home_risk.factor_count AS home_risk_factor_count,
            home_risk.risk_summary AS home_risk_summary

        FROM schedule.games g

        LEFT JOIN reference.teams away_team
          ON away_team.team_id = g.away_team_id

        LEFT JOIN reference.teams home_team
          ON home_team.team_id = g.home_team_id

        LEFT JOIN projections.game_spreads p
          ON p.game_id = g.game_id
         AND p.season = g.season
         AND p.week = g.week

        LEFT JOIN market.consensus_spreads away_consensus
          ON away_consensus.game_id = g.game_id
         AND away_consensus.team_id = g.away_team_id

        LEFT JOIN market.consensus_spreads home_consensus
          ON home_consensus.game_id = g.game_id
         AND home_consensus.team_id = g.home_team_id

        LEFT JOIN market.projection_edges away_edge
          ON away_edge.game_id = g.game_id
         AND away_edge.team_id = g.away_team_id

        LEFT JOIN market.projection_edges home_edge
          ON home_edge.game_id = g.game_id
         AND home_edge.team_id = g.home_team_id

        LEFT JOIN LATERAL (
            SELECT
                r.risk_score,
                r.risk_stars,
                r.risk_level,
                r.factor_count,
                r.risk_summary
            FROM risk.game_risk_scores r
            WHERE r.game_id = g.game_id
              AND r.team_id = g.away_team_id
              AND r.season = g.season
              AND r.week = g.week
            ORDER BY r.created_at DESC NULLS LAST,
                     r.game_risk_score_id DESC
            LIMIT 1
        ) away_risk ON TRUE

        LEFT JOIN LATERAL (
            SELECT
                r.risk_score,
                r.risk_stars,
                r.risk_level,
                r.factor_count,
                r.risk_summary
            FROM risk.game_risk_scores r
            WHERE r.game_id = g.game_id
              AND r.team_id = g.home_team_id
              AND r.season = g.season
              AND r.week = g.week
            ORDER BY r.created_at DESC NULLS LAST,
                     r.game_risk_score_id DESC
            LIMIT 1
        ) home_risk ON TRUE

        WHERE g.season = %s
          AND g.week = %s

        ORDER BY
            g.gameday,
            g.gametime,
            g.game_id;
    """

    risk_factors_sql = """
        SELECT
            game_id,
            team_id,
            game_risk_factor_id,
            risk_type,
            severity,
            risk_points,
            description,
            source_system,
            created_at
        FROM risk.game_risk_factors
        WHERE season = %s
          AND week = %s
        ORDER BY
            game_id,
            team_id,
            risk_points DESC,
            risk_type,
            game_risk_factor_id;
    """

    sportsbooks_sql = """
        WITH latest_team_lines AS (
            SELECT DISTINCT ON (
                e.game_id,
                s.bookmaker_key,
                s.team_id
            )
                e.game_id,
                e.market_event_id,
                e.commence_time,
                s.bookmaker_key,
                b.bookmaker_title,
                s.team_id,
                s.team_abbr,
                s.spread_points,
                s.price,
                s.last_update,
                s.pulled_at
            FROM schedule.games g
            JOIN market.events e
              ON e.game_id = g.game_id
            JOIN market.spreads s
              ON s.market_event_id = e.market_event_id
            LEFT JOIN market.bookmakers b
              ON b.bookmaker_key = s.bookmaker_key
            WHERE g.season = %s
              AND g.week = %s
            ORDER BY
                e.game_id,
                s.bookmaker_key,
                s.team_id,
                s.pulled_at DESC,
                s.last_update DESC NULLS LAST,
                s.market_spread_id DESC
        )

        SELECT
            g.game_id,
            l.bookmaker_key,
            l.bookmaker_title,

            MAX(l.spread_points)
                FILTER (WHERE l.team_id = g.away_team_id)
                AS away_spread,

            MAX(l.price)
                FILTER (WHERE l.team_id = g.away_team_id)
                AS away_price,

            MAX(l.spread_points)
                FILTER (WHERE l.team_id = g.home_team_id)
                AS home_spread,

            MAX(l.price)
                FILTER (WHERE l.team_id = g.home_team_id)
                AS home_price,

            MAX(l.last_update) AS last_update,
            MAX(l.pulled_at) AS pulled_at,
            MAX(l.commence_time) AS commence_time

        FROM schedule.games g
        JOIN latest_team_lines l
          ON l.game_id = g.game_id

        WHERE g.season = %s
          AND g.week = %s

        GROUP BY
            g.game_id,
            l.bookmaker_key,
            l.bookmaker_title

        ORDER BY
            g.game_id,
            l.bookmaker_title,
            l.bookmaker_key;
    """

    try:
        with db.cursor() as cursor:
            cursor.execute(games_sql, (season, week))
            game_rows = [
                row_to_dict(cursor, row)
                for row in cursor.fetchall()
            ]

            cursor.execute(
                sportsbooks_sql,
                (season, week, season, week),
            )
            sportsbook_rows = [
                row_to_dict(cursor, row)
                for row in cursor.fetchall()
            ]

            cursor.execute(
                risk_factors_sql,
                (season, week),
            )
            risk_factor_rows = [
                row_to_dict(cursor, row)
                for row in cursor.fetchall()
            ]

        sportsbooks_by_game: dict[str, list[dict[str, Any]]] = defaultdict(list)

        for row in sportsbook_rows:
            sportsbooks_by_game[row["game_id"]].append({
                "bookmaker_key": row["bookmaker_key"],
                "bookmaker_title": (
                    row["bookmaker_title"]
                    or row["bookmaker_key"]
                ),
                "away_spread": row["away_spread"],
                "away_price": row["away_price"],
                "home_spread": row["home_spread"],
                "home_price": row["home_price"],
                "last_update": row["last_update"],
                "pulled_at": row["pulled_at"],
                "commence_time": row["commence_time"],
            })

        risk_factors_by_game_team: dict[
            tuple[str, int],
            list[dict[str, Any]],
        ] = defaultdict(list)

        for row in risk_factor_rows:
            key = (
                row["game_id"],
                int(row["team_id"]),
            )

            risk_factors_by_game_team[key].append({
                "game_risk_factor_id": (
                    row["game_risk_factor_id"]
                ),
                "risk_type": row["risk_type"],
                "severity": row["severity"],
                "risk_points": row["risk_points"],
                "description": row["description"],
                "source_system": row["source_system"],
                "created_at": row["created_at"],
            })

        games = []

        for row in game_rows:
            games.append({
                "game_id": row["game_id"],
                "season": row["season"],
                "week": row["week"],
                "game_type": row["game_type"],
                "gameday": row["gameday"],
                "gametime": row["gametime"],

                "away_team": {
                    "team_id": row["away_team_id"],
                    "team_abbr": row["away_team_abbr"],
                    "team_name": row["away_team_name"],
                    "power_rating": row["away_power_rating"],
                },

                "home_team": {
                    "team_id": row["home_team_id"],
                    "team_abbr": row["home_team_abbr"],
                    "team_name": row["home_team_name"],
                    "power_rating": row["home_power_rating"],
                },

                "schedule_reference": {
                    "spread_line": row["schedule_spread_line"],
                    "total_line": row["schedule_total_line"],
                },

                "semisharp_projection": {
                    "rating_week": row["rating_week"],
                    "power_rating_diff": row["power_rating_diff"],
                    "home_field_points": row["home_field_points"],
                    "projected_home_margin": row["projected_home_margin"],
                    "projected_favorite_team_id": (
                        row["projected_favorite_team_id"]
                    ),
                    "projected_favorite_abbr": (
                        row["projected_favorite_abbr"]
                    ),
                    "projected_spread": row["projected_spread"],
                    "source_system": row["projection_source"],
                    "created_at": row["projection_created_at"],

                    # No calibrated win-probability field exists yet.
                    "home_win_probability": None,
                    "away_win_probability": None,
                },

                "market": {
                    "away_consensus_spread": (
                        row["away_consensus_spread"]
                    ),
                    "away_consensus_price": (
                        row["away_consensus_price"]
                    ),
                    "home_consensus_spread": (
                        row["home_consensus_spread"]
                    ),
                    "home_consensus_price": (
                        row["home_consensus_price"]
                    ),
                    "sportsbook_count": (
                        row["consensus_sportsbook_count"]
                    ),
                    "latest_snapshot": (
                        row["consensus_latest_snapshot"]
                    ),

                    "away_edge": {
                        "semisharp_spread": (
                            row["away_semisharp_spread"]
                        ),
                        "market_spread": row["away_market_spread"],
                        "edge_points": row["away_edge_points"],
                    },

                    "home_edge": {
                        "semisharp_spread": (
                            row["home_semisharp_spread"]
                        ),
                        "market_spread": row["home_market_spread"],
                        "edge_points": row["home_edge_points"],
                    },

                    "sportsbooks": sportsbooks_by_game.get(
                        row["game_id"],
                        [],
                    ),
                },

                "risk": {
                    "away": {
                        "score": row["away_risk_score"],
                        "stars": row["away_risk_stars"],
                        "level": row["away_risk_level"],
                        "factor_count": row[
                            "away_risk_factor_count"
                        ],
                        "summary": row["away_risk_summary"],
                        "factors": risk_factors_by_game_team.get(
                            (
                                row["game_id"],
                                int(row["away_team_id"]),
                            ),
                            [],
                        ),
                    },

                    "home": {
                        "score": row["home_risk_score"],
                        "stars": row["home_risk_stars"],
                        "level": row["home_risk_level"],
                        "factor_count": row[
                            "home_risk_factor_count"
                        ],
                        "summary": row["home_risk_summary"],
                        "factors": risk_factors_by_game_team.get(
                            (
                                row["game_id"],
                                int(row["home_team_id"]),
                            ),
                            [],
                        ),
                    },
                },
            })

        return {
            "season": season,
            "week": week,
            "game_count": len(games),
            "games": games,
        }

    finally:
        db.close()


@router.get("/game/{game_id}")
def get_game_analysis(
    game_id: str,
    db=Depends(get_connection),
):
    """
    Return the consolidated analysis payload for one scheduled game.

    This reuses the validated weekly-analysis builder so the weekly and
    single-game contracts cannot drift apart.
    """
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """
                SELECT season, week
                FROM schedule.games
                WHERE game_id = %s
                LIMIT 1;
                """,
                (game_id,),
            )
            schedule_row = cursor.fetchone()

        if schedule_row is None:
            raise HTTPException(
                status_code=404,
                detail=f"Game not found: {game_id}",
            )

        season = int(schedule_row[0])
        week = int(schedule_row[1])

        weekly_payload = get_weekly_game_analysis(
            season=season,
            week=week,
            db=db,
        )

        game = next(
            (
                item
                for item in weekly_payload["games"]
                if item["game_id"] == game_id
            ),
            None,
        )

        if game is None:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis not found for game: {game_id}",
            )

        return game

    finally:
        if not db.closed:
            db.close()
