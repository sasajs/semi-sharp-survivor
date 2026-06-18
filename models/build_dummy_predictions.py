import os
import json
import psycopg2
from psycopg2.extras import execute_values


def main():
    season = int(os.environ.get("SS_SEASON", "2026"))
    week = int(os.environ.get("SS_WEEK", "1"))
    data_version = os.environ.get("SS_DATA_VERSION", "v0_fake")

    dsn = os.environ.get("SS_PG_DSN")
    if not dsn:
        raise RuntimeError("SS_PG_DSN is not set")

    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            # ---------------------------------------------------------
            # 1) Read distinct feature rows (one per model_hash)
            # ---------------------------------------------------------
            cur.execute(
                """
                SELECT DISTINCT
                    season,
                    week,
                    data_version,
                    model_hash
                FROM features_history
                WHERE season = %s
                  AND week = %s
                  AND data_version = %s
                """,
                (season, week, data_version),
            )

            rows = cur.fetchall()
            if not rows:
                raise RuntimeError("No feature rows found for this week")

            # ---------------------------------------------------------
            # 2) Idempotency guard
            # ---------------------------------------------------------
            cur.execute(
                """
                SELECT 1
                FROM model_predictions_history
                WHERE season = %s
                  AND week = %s
                  AND data_version = %s
                LIMIT 1
                """,
                (season, week, data_version),
            )

            if cur.fetchone():
                print(
                    "Predictions already exist for this "
                    "(season, week, data_version). No-op."
                )
                conn.rollback()
                return

            # ---------------------------------------------------------
            # 3) Build deterministic dummy predictions
            # ---------------------------------------------------------
            out_rows = []

            for s, w, dv, model_hash in rows:
                predictions = {
                    "spread_mean": -2.5,
                    "spread_sd": 6.0,
                    "total_mean": 44.0,
                    "total_sd": 7.5,
                    "notes": "dummy deterministic model v0",
                }

                out_rows.append(
                    (
                        s,
                        w,
                        dv,
                        model_hash,
                        json.dumps(predictions),
                    )
                )

            # ---------------------------------------------------------
            # 4) Append-only insert
            # ---------------------------------------------------------
            execute_values(
                cur,
                """
                INSERT INTO model_predictions_history (
                    season,
                    week,
                    data_version,
                    model_hash,
                    predictions
                )
                VALUES %s
                """,
                out_rows,
            )

            conn.commit()
            print(
                f"Inserted {len(out_rows)} rows into model_predictions_history."
            )

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()

