#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
    cd "$(
        dirname "${BASH_SOURCE[0]}"
    )/.." &&
    pwd
)"

cd "$ROOT_DIR"

SEASON="${SEASON:-2026}"
WEEK="${WEEK:-1}"

LOG_DIR="artifacts/validation"
LOG_FILE="${LOG_DIR}/full_pipeline_${SEASON}_week_${WEEK}.log"

mkdir -p "$LOG_DIR"

exec > >(
    tee "$LOG_FILE"
) 2>&1

run_step() {
    local name="$1"
    local command="$2"

    echo
    echo "============================================================"
    echo "$name"
    echo "============================================================"
    echo "Command: $command"
    echo "Started: $(date --iso-8601=seconds)"

    if [[ -z "$command" ]]; then
        echo "SKIP: no command configured"
        return 0
    fi

    bash -lc "$command"

    echo "Completed: $(date --iso-8601=seconds)"
}

echo "SemiSharp full pipeline"
echo "Season: $SEASON"
echo "Week: $WEEK"
echo "Started: $(date --iso-8601=seconds)"
echo "Repository: $ROOT_DIR"

run_step \
    "1. SCHEDULE INGESTION" \
    "${PIPELINE_SCHEDULE_COMMAND:-}"

run_step \
    "2. RATINGS INGESTION" \
    "${PIPELINE_RATINGS_COMMAND:-}"

run_step \
    "3. HOME FIELD ADVANTAGE REFRESH" \
    "${PIPELINE_HFA_COMMAND:-}"

run_step \
    "4. PROJECTION BUILD" \
    "${PIPELINE_PROJECTION_COMMAND:-}"

run_step \
    "5. RISK BUILD" \
    "${PIPELINE_RISK_COMMAND:-}"

run_step \
    "6. MARKET INGESTION" \
    "${PIPELINE_MARKET_COMMAND:-}"

run_step \
    "7. MARKET CONSENSUS REFRESH" \
    "${PIPELINE_CONSENSUS_COMMAND:-}"

run_step \
    "8. PROJECTION EDGE REFRESH" \
    "${PIPELINE_EDGE_COMMAND:-}"

run_step \
    "9. DATABASE VALIDATION" \
    "sudo -u postgres psql \
        -d semisharp \
        -P pager=off \
        -f scripts/validation/validate_database.sql"

run_step \
    "10. BACKEND RESTART" \
    "sudo systemctl restart semisharp-backend && sleep 3"

run_step \
    "11. BACKEND VALIDATION" \
    "SEASON=$SEASON WEEK=$WEEK \
        scripts/validation/validate_backend.sh"

run_step \
    "12. PUBLIC API VALIDATION" \
    "python3 scripts/validation/validate_analysis_api.py \
        --base-url https://api.steveschilhabel.com \
        --season $SEASON \
        --week $WEEK \
        --report artifacts/validation/public_api_validation.md \
        --json-output artifacts/validation/public_api_response.json"

echo
echo "============================================================"
echo "PIPELINE COMPLETE"
echo "============================================================"
echo "Completed: $(date --iso-8601=seconds)"
echo "Log: $LOG_FILE"
