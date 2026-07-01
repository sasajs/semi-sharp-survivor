#!/bin/bash
# scripts/db-validation.sh
set -e
echo "Running database relationship validation script..."
npx tsx scripts/db-validation.ts
