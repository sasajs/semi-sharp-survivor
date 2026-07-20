#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
SEASON="${SEASON:-2026}"
WEEK="${WEEK:-1}"

echo "============================================================"
echo "SEMISHARP BACKEND VALIDATION"
echo "============================================================"

echo
echo "===== PYTHON COMPILE ====="

python3 -m py_compile app/main.py
python3 -m py_compile app/api/analysis.py

echo "PASS: Python compilation"

echo
echo "===== APPLICATION IMPORT ====="

python3 -c "
from app.main import app
print('PASS: FastAPI application import')
"

echo
echo "===== HEALTH ====="

curl --fail --silent --show-error \
    "${BASE_URL}/health" \
    | python3 -m json.tool

echo
echo "===== OPENAPI ROUTE ====="

OPENAPI_FILE="$(
    mktemp
)"

trap 'rm -f "$OPENAPI_FILE"' EXIT

curl --fail --silent --show-error \
    "${BASE_URL}/openapi.json" \
    > "$OPENAPI_FILE"

python3 - "$OPENAPI_FILE" "$SEASON" "$WEEK" <<'PY'
import json
import sys

path = sys.argv[1]
season = sys.argv[2]
week = sys.argv[3]

with open(path) as handle:
    document = json.load(handle)

route = "/analysis/week/{season}/{week}"

if route not in document.get("paths", {}):
    raise SystemExit(
        f"FAIL: missing OpenAPI route {route}"
    )

methods = document["paths"][route]

if "get" not in methods:
    raise SystemExit(
        f"FAIL: GET method missing for {route}"
    )

print(f"PASS: {route} GET")
print(
    f"Runtime example: /analysis/week/{season}/{week}"
)
PY

echo
echo "===== ANALYSIS CONTRACT ====="

python3 scripts/validation/validate_analysis_api.py \
    --base-url "$BASE_URL" \
    --season "$SEASON" \
    --week "$WEEK"

echo
echo "PASS: backend validation complete"
