#!/usr/bin/env python3
"""
Canonical weekly runner for SemiSharp V2.

This is the ONLY supported orchestration entrypoint.

Design:
- One command = one (season, week, data_version, model_hash, policy_version)
- Safe to rerun (idempotent)
- No business logic lives here
- All timestamps are UTC, timezone-aware
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------
# BOOTSTRAP PROJECT ROOT INTO PYTHON PATH (DO NOT REMOVE)
# ---------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run SemiSharp weekly pipeline"
    )

    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)

    parser.add_argument(
        "--data-version",
        dest="data_version",
        required=True,
        help="Version of raw weekly inputs",
    )
    parser.add_argument(
        "--model-hash",
        dest="model_hash",
        required=True,
        help="Deterministic model identifier",
    )
    parser.add_argument(
        "--policy-version",
        dest="policy_version",
        required=True,
        help="Decision policy identifier",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    started_at = datetime.now(timezone.utc).isoformat()

    print(f"[RUN_WEEK] {args.season} W{args.week}")
    print(f"data_version={args.data_version}")
    print(f"model_hash={args.model_hash}")
    print(f"policy_version={args.policy_version}")
    print(f"started_at={started_at}")

    # ------------------------------------------------------------------
    # STEP 1 — Ingest weekly inputs
    # ------------------------------------------------------------------
    print("[1] ingest weekly inputs")
    print("    (noop / already done)")

    # ------------------------------------------------------------------
    # STEP 2 — Build feature snapshot (REAL)
    # ------------------------------------------------------------------
    print("[2] build features")
    from features.build_features_week import build_features_week

    rows = build_features_week(
        season=args.season,
        week=args.week,
        data_version=args.data_version,
        model_hash=args.model_hash,
        policy_version=args.policy_version,
    )
    print(f"    inserted={rows}")

    # ------------------------------------------------------------------
    # STEP 3 — Generate model predictions (stub)
    # ------------------------------------------------------------------
    print("[3] generate predictions")
    # from models.generate_predictions_week import generate_predictions_week
    # rows = generate_predictions_week(
    #     season=args.season,
    #     week=args.week,
    #     data_version=args.data_version,
    #     model_hash=args.model_hash,
    # )
    # print(f"    inserted={rows}")
    print("    (stub)")

    # ------------------------------------------------------------------
    # STEP 4 — Run decision agent (stub)
    # ------------------------------------------------------------------
    print("[4] run agent")
    # from agents.run_ats_agent_week import run_ats_agent_week
    # rows = run_ats_agent_week(
    #     season=args.season,
    #     week=args.week,
    #     data_version=args.data_version,
    #     model_hash=args.model_hash,
    #     policy_version=args.policy_version,
    # )
    # print(f"    inserted={rows}")
    print("    (stub)")

    # ------------------------------------------------------------------
    # STEP 5 — Generate deterministic weekly report (stub)
    # ------------------------------------------------------------------
    print("[5] generate report")
    # from reports.generate_weekly_report import generate_weekly_report
    # path = generate_weekly_report(
    #     season=args.season,
    #     week=args.week,
    #     data_version=args.data_version,
    #     model_hash=args.model_hash,
    #     policy_version=args.policy_version,
    # )
    # print(f"    written={path}")
    print("    (stub)")

    print("[DONE]")
    return 0


if __name__ == "__main__":
    sys.exit(main())

