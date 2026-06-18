#!/usr/bin/env python3
"""
Trivial ATS Agent – Phase 2 (Plumbing Only)

Purpose:
- Prove agent execution
- Prove policy_versioning
- Prove append-only writes
- Prove idempotency
- NO game selection
- NO EV logic
- NO intelligence

This agent records that it ran and what model output it observed.
"""

import argparse
import json
import os
import psycopg2
import psycopg2.extras

POLICY_VERSION = "ats_v0_trivial"


def get_connection():
    dsn = os.environ.get("SS_PG_DSN")
    if not dsn:
        raise RuntimeError("SS_PG_DSN environment variable is not set")
    return psycopg2.connect(dsn)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--data-version", dest="data_version", required=True)
    args = parser.parse_args()

    season = args.season
    week = args.week
    data_version = args.data_version

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:

            # 1) Read model prediction artifact (week-level)
            cur.execute(
                """
                SELECT model_hash, predictions
                FROM model_predictions_history
                WHERE season = %s
                  AND week = %s
                  AND data_version = %s
                ORDER BY model_hash
                LIMIT 1
                """,
                (season, week, data_version),
            )

            row = cur.fetchone()
            if row is None:
                raise RuntimeError(
                    f"No model predictions found for season={season}, week={week}, data_version={data_version}"
                )

            model_hash = row["model_hash"]
            prediction_keys = sorted(row["predictions"].keys())

            # 2) Build metadata-only decision payload
            decisions = {
                "agent": "ats",
                "policy_version": POLICY_VERSION,
                "action": "no_op",
                "reason": "Phase 2 plumbing agent; no per-game predictions exist yet",
                "observed_model_hash": model_hash,
                "observed_prediction_keys": prediction_keys,
            }

            # 3) Append-only insert (idempotent via PK)
            cur.execute(
                """
                INSERT INTO agent_decisions_history
                  (season, week, data_version, policy_version, decisions)
                VALUES
                  (%s, %s, %s, %s, %s::jsonb)
                ON CONFLICT DO NOTHING
                """,
                (
                    season,
                    week,
                    data_version,
                    POLICY_VERSION,
                    json.dumps(decisions),
                ),
            )

            print(
                f"OK: {POLICY_VERSION} recorded decision "
                f"(model_hash={model_hash})"
            )


if __name__ == "__main__":
    main()

