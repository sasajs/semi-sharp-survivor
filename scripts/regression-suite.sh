#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p reports/validation

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOGFILE="reports/validation/${TIMESTAMP}_regression.log"
SERVER_STARTED_BY_SCRIPT=0
SERVER_PID=""

cleanup() {
  if [ "$SERVER_STARTED_BY_SCRIPT" = "1" ] && [ -n "$SERVER_PID" ]; then
    echo ""
    echo "Stopping temporary Semi-Sharp server PID $SERVER_PID"
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

{
echo "======================================================"
echo "        Semi-Sharp Regression Suite"
echo "======================================================"
echo ""
echo "Date        : $(date)"
echo "Git Commit  : $(git rev-parse --short HEAD)"
echo "Branch      : $(git branch --show-current)"
echo ""

echo "------------------------------------------------------"
echo "1. Update Validation"
echo "------------------------------------------------------"
./scripts/validate-update.sh

echo ""
echo "------------------------------------------------------"
echo "2. Database Validation"
echo "------------------------------------------------------"
./scripts/db-validation.sh

echo ""
echo "------------------------------------------------------"
echo "3. Ensure Server Is Running"
echo "------------------------------------------------------"

if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "✓ Server already running."
else
  echo "Starting temporary Semi-Sharp server..."
  npm run dev > reports/validation/${TIMESTAMP}_server.log 2>&1 &
  SERVER_PID=$!
  SERVER_STARTED_BY_SCRIPT=1

  echo "Waiting for server startup..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
      echo "✓ Server started."
      break
    fi
    sleep 1
  done

  if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✗ Server failed to start."
    echo "See server log:"
    echo "reports/validation/${TIMESTAMP}_server.log"
    exit 1
  fi
fi

echo ""
echo "------------------------------------------------------"
echo "4. API Validation"
echo "------------------------------------------------------"
./scripts/api-validation.sh

echo ""
echo "======================================================"
echo "Regression Suite Completed Successfully"
echo "======================================================"

} | tee "$LOGFILE"

echo ""
echo "Validation log written to:"
echo "$LOGFILE"
