import os
import json
import hashlib
import psycopg2
from psycopg2.extras import execute_values

FEATURE_SET_VERSION = "fs_v0_min"


def sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def main():
    season = int(os.environ.get("SS_SEASON", "2026"))
    week = int(os.environ.get("SS_WEEK", "1"))
    data_version = os.environ.get("SS_DATA_VERSION", "v0_fake")

    dsn = os.environ.get("SS_PG_DSN")
    if not dsn:
        raise RuntimeError("SS_PG_DSN is not set")

    # Treat model_hash as feature-definition hash for Step 3.4
    feature_def_hash = sha1(
        json.dumps(
            {
                "feature_set_version": FEATURE_SET_VERSION,
                "features": [
                    "home_team_id",
                    "away_team_id",
                    "home_is_home",
                    "rest_diff",
                    "travel_diff",
                    "market_spread_open",
                    "market_total_open",
                ],
            },
            sort_keys=True,
        )
    )

    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            # 1) Read raw games
            cur.execute(
                """
                SELECT
                    season,
                    week,
                    data_version,
                    home_team_id,
                    away_team_id
                FROM raw_games_weekly
                WHERE season = %s
                  AND week = %s
                  AND data_version = %s
                ORDER BY home_team_id, away_team_id
                """,
                (season, week, data_version),
            )

            rows = cur.fetchall()
            if not rows:
                raise RuntimeError("No rows found in raw_games_weekly")

            # 2) Idempotency guard via primary key
            cur.execute(
                """
                SELECT 1
                FROM features_history
                WHERE season = %s
                  AND week = %s
                  AND data_version = %s
                  AND model_hash = %s
                LIMIT 1
                """,
                (season, week, data_version, feature_def_hash),
            )

            if cur.fetchone():
                print(
                    "Features already exist for this "
                    "(season, week, data_version, model_hash). No-op."
                )
                conn.rollback()
                return

            out_rows = []

            for s, w, dv, home_id, away_id in rows:
                features = {
                    "feature_set_version": FEATURE_SET_VERSION,
                    "home_team_id": home_id,
                    "away_team_id": away_id,
                    "home_is_home": 1,
                    "rest_diff": 0,
                    "travel_diff": 0,
                    "market_spread_open": 0.0,
                    "market_total_open": 0.0,
                }

                out_rows.append(
                    (
                        s,
                        w,
                        dv,
                        feature_def_hash,   # model_hash slot
                        None,               # policy_version
                        json.dumps(features),
                    )
                )

            execute_values(
                cur,
                """
                INSERT INTO features_history (
                    season,
                    week,
                    data_version,
                    model_hash,
                    policy_version,
                    features
                )
                VALUES %s
                """,
                out_rows,
            )

            conn.commit()
            print(f"Inserted {len(out_rows)} feature rows into features_history.")

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()

