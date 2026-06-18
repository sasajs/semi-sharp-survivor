#!/usr/bin/env python3
"""
Build weekly feature snapshot and write to features_history.

Granularity:
- ONE row per (season, week, data_version, model_hash)
- All game features stored inside features JSONB

All values written to JSONB are JSON-primitive-safe.
"""

from datetime import datetime, timezone
from typing import Dict, Any
from decimal import Decimal
import psycopg2
import os
import json
import hashlib


WEEKLY_GAMES_TABLE = "raw_games_weekly"
FEATURE_SET_VERSION = "v0_stub"


def _get_conn():
    dsn = os.environ.get("SS_PG_DSN")
    if not dsn:
        raise RuntimeError("SS_PG_DSN not set")
    return psycopg2.connect(dsn)


def _num(x):
    """
    Convert Postgres numerics (Decimal) into JSON-safe values.
    """
    if x is None:
        return None
    if isinstance(x, Decimal):
        return float(x)
    return x


def _build_game_features(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build features for a single game.
    All outputs MUST be JSON-serializable.
    """
    return {
        "home_team_id": row["home_team_id"],
        "away_team_id": row["away_team_id"],
        "spread": _num(row["spread"]),
        "total": _num(row["total"]),
        "bias": 1.0,
    }


def _feature_def_hash(feature_set_version: str) -> str:
    h = hashlib.sha256()
    h.update(feature_set_version.encode("utf-8"))
    return h.hexdigest()


def build_features_week(
    *,
    season: int,
    week: int,
    data_version: str,
    model_hash: str,
    policy_version: str | None = None,
) -> int:
    now = datetime.now(timezone.utc)

    with _get_conn() as conn:
        with conn.cursor() as cur:

            cur.execute(
                f"""
                SELECT
                    game_id,
                    home_team_id,
                    away_team_id,
                    spread,
                    total
                FROM {WEEKLY_GAMES_TABLE}
                WHERE season = %s
                  AND week = %s
                  AND data_version = %s
                ORDER BY game_id
                """,
                (season, week, data_version),
            )

            rows = cur.fetchall()

            if not rows:
                print("    no games found for this season/week/data_version")
                return 0

            colnames = [desc[0] for desc in cur.description]

            games: Dict[str, Any] = {}
            for raw in rows:
                row = dict(zip(colnames, raw))
                games[row["game_id"]] = _build_game_features(row)

            features_payload = {
                "games": games,
                "n_games": len(games),
            }

            feature_def_hash = _feature_def_hash(FEATURE_SET_VERSION)

            cur.execute(
                """
                INSERT INTO features_history (
                    season,
                    week,
                    data_version,
                    model_hash,
                    policy_version,
                    features,
                    feature_set_version,
                    feature_def_hash,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (
                    season,
                    week,
                    data_version,
                    model_hash,
                    policy_version,
                    json.dumps(features_payload),
                    FEATURE_SET_VERSION,
                    feature_def_hash,
                    now,
                ),
            )

            inserted = cur.rowcount

        conn.commit()

    return inserted


if __name__ == "__main__":
    raise RuntimeError("Do not run directly. Use scripts/run_week.py.")

