#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Restoring Semi-Sharp local development configuration..."

git checkout HEAD -- package.json .gitignore reports/validation/.gitkeep

bash ./scripts/fix-vite-config.sh

rm -f test_rec.ts

echo "✓ Local development configuration restored."
