#!/bin/bash
# Updated Wrapper for Documentation Generation and Regression Testing

MODE=$1
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
# Pointing to the top-level Logs folder as requested
LOG_DIR="/home/steve/Projects/SemiSharp/BackEnd/Logs"
LOG_FILE="${LOG_DIR}/refresh_${MODE}_${TIMESTAMP}.log"

# Ensure the Logs directory exists
mkdir -p "$LOG_DIR"

echo "Starting $MODE validation..." | tee -a "$LOG_FILE"

# 1. Generate Documentation (Ensure this path is correct based on the find command above)
python3 ./scripts/documentation/generate_api_catalog.py >> "$LOG_FILE" 2>&1
python3 ./scripts/documentation/generate_system_snapshot.py >> "$LOG_FILE" 2>&1

# 2. Run Modular Regression
if [ "$MODE" == "full" ]; then
    PYTHONPATH=. .venv/bin/python3 scripts/tests/regression_test_full.py >> "$LOG_FILE" 2>&1
else
    PYTHONPATH=. .venv/bin/python3 scripts/tests/regression_test_fast.py >> "$LOG_FILE" 2>&1
fi

if [ $? -eq 0 ]; then
    echo "Validation PASSED." | tee -a "$LOG_FILE"
else
    echo "Validation FAILED. Check logs: $LOG_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

# 3. Git Status
git status >> "$LOG_FILE" 2>&1
