#!/bin/bash
# Ensure we are in the project root
cd "$(dirname "$0")"
# Add current directory to PYTHONPATH so 'app' is found
export PYTHONPATH=.
# Run the test suite
./.venv/bin/python3 scripts/tests/regression_test.py
