#!/bin/bash
# scripts/regression-suite.sh
set -e

echo "=== Semi-Sharp Regression Suite Validation ==="

# Clean up log file if it exists
rm -f server-startup.log

SERVER_PID=""

cleanup() {
  echo "=== Cleanup Phase ==="
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping temporary Semi-Sharp server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    sleep 2
    # Check if still running, force kill if needed
    if kill -0 "$SERVER_PID" 2>/dev/null; then
      echo "Force terminating temporary server..."
      kill -9 "$SERVER_PID" 2>/dev/null || true
    fi
  fi
  
  # Check if port 3000 is free
  PORT_3000_OCCUPIED=$(ss -tlnH sport = :3000 2>/dev/null || netstat -tln | grep :3000 || grep -q "0BB8" /proc/net/tcp 2>/dev/null && echo "Occupied" || echo "")
  if [ -n "$PORT_3000_OCCUPIED" ]; then
    echo "ERROR: Port 3000 is still occupied after cleanup!"
    exit 1
  fi
  echo "PASS: Port 3000 is free after cleanup."
}

# Trap cleanup to run on exit (success/failure) or SIGINT/SIGTERM
trap cleanup EXIT SIGINT SIGTERM

# Start server in background and save PID
echo "Starting temporary Semi-Sharp server in background..."
npx tsx server.ts > server-startup.log 2>&1 &
SERVER_PID=$!
echo "Temporary server started with PID: $SERVER_PID. Redirecting logs to server-startup.log."

# Wait for server to boot or log success/failure
echo "Waiting for server to initialize..."
BOOT_SUCCESS=false
for i in {1..20}; do
  if [ ! -f server-startup.log ]; then
    sleep 1
    continue
  fi
  
  # Check for success indicators
  if grep -q "PostgreSQL connection, migrations, and seeding completed successfully" server-startup.log; then
    echo "Detected successful PostgreSQL initialization log."
    BOOT_SUCCESS=true
    break
  fi
  
  if grep -q "Server running on port" server-startup.log || grep -q "Server running on http" server-startup.log; then
    echo "Detected server running log."
    BOOT_SUCCESS=true
    break
  fi
  
  # Check for early fallback/errors
  if grep -q "\[Database Fallback\]" server-startup.log || grep -q "Activating mock persistence" server-startup.log; then
    echo "ERROR: Detected mock fallback in startup logs!"
    cat server-startup.log
    exit 1
  fi
  
  sleep 1
done

if [ "$BOOT_SUCCESS" = false ]; then
  echo "ERROR: Server failed to initialize within timeout."
  echo "--- Startup Log ---"
  cat server-startup.log
  exit 1
fi

echo "Verifying server startup logs..."

# Task 2: Check for fallback logs
if grep -q "\[Database Fallback\]" server-startup.log; then
  echo "ERROR: Validation failed: Log contains '[Database Fallback]'"
  exit 1
fi

if grep -q "mock-sandbox" server-startup.log; then
  echo "ERROR: Validation failed: Log contains 'mock-sandbox' database name"
  exit 1
fi

if grep -q "Activating mock persistence" server-startup.log; then
  echo "ERROR: Validation failed: Log contains 'Activating mock persistence'"
  exit 1
fi

# Task 3: Check for required successful database indicators
if ! grep -q "PostgreSQL connection, migrations, and seeding completed successfully" server-startup.log; then
  echo "ERROR: Validation failed: Startup log is missing 'PostgreSQL connection, migrations, and seeding completed successfully'"
  exit 1
fi

if ! grep -q "DB: postgres" server-startup.log; then
  echo "ERROR: Validation failed: Startup log is missing 'DB: postgres'"
  exit 1
fi

if ! grep -q "Repository mode selected: RELATIONAL POSTGRES" server-startup.log; then
  echo "ERROR: Validation failed: Startup log is missing 'Repository mode selected: RELATIONAL POSTGRES'"
  exit 1
fi

echo "PASS: Server started successfully in RELATIONAL POSTGRES mode."

# Run database schema/seed validation
echo "Running Database Validation..."
bash scripts/db-validation.sh

# Run API endpoint integration validation
echo "Running API Validation..."
bash scripts/api-validation.sh

echo "=== All Regression Validation Suites Passed Successfully ==="
