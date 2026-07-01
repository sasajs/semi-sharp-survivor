#!/bin/bash
# scripts/api-validation.sh
set -e
echo "Running API integration validation..."
npx tsx scripts/api-validation.ts
