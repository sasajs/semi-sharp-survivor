#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "==============================================="
echo " Semi-Sharp API Validation"
echo "==============================================="
echo ""
echo "Using API: $BASE_URL"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

check_endpoint() {
    local name="$1"
    local endpoint="$2"

    printf "%-35s" "$name"

    status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}" || echo "000")

    if [[ "$status" =~ ^2|3 ]]; then
        echo "PASS ($status)"
        PASS_COUNT=$((PASS_COUNT+1))
    else
        echo "FAIL ($status)"
        FAIL_COUNT=$((FAIL_COUNT+1))
    fi
}

echo "Checking server..."

if ! curl -s "${BASE_URL}" >/dev/null; then
    echo ""
    echo "ERROR: Server is not responding."
    echo ""
    echo "Start it with:"
    echo "    npm run dev"
    exit 1
fi

echo "✓ Server responding"
echo ""

echo "Checking API endpoints..."
echo ""

check_endpoint "Dashboard API" "/api/dashboard"
check_endpoint "Entries API" "/api/entries"
check_endpoint "Contest Types API" "/api/contest-types"
check_endpoint "Roadmaps API" "/api/roadmaps"
check_endpoint "Recommendations API" "/api/recommendations"
check_endpoint "Reports API" "/api/reports"
check_endpoint "Owners API" "/api/owners"

echo ""
echo "==============================================="
echo "Results"
echo "==============================================="

echo "Passed : $PASS_COUNT"
echo "Failed : $FAIL_COUNT"

echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "✓ API Validation PASSED"
    exit 0
else
    echo "✗ API Validation FAILED"
    exit 1
fi

