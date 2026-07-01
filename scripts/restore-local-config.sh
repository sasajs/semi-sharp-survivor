#!/bin/bash
# scripts/restore-local-config.sh
set -e

echo "=== Restoring Local Configuration ==="

if [ -f .env.example ]; then
  echo "Copying .env.example to .env..."
  cp .env.example .env
  
  # Configure .env to run in PostgreSQL mode (without mock fallback) for strict testing
  echo "Setting USE_MOCK=false and USE_MOCK_DATA=false in .env..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/USE_MOCK=true/USE_MOCK=false/g' .env
    sed -i '' 's/USE_MOCK_DATA=true/USE_MOCK_DATA=false/g' .env
  else
    sed -i 's/USE_MOCK=true/USE_MOCK=false/g' .env
    sed -i 's/USE_MOCK_DATA=true/USE_MOCK_DATA=false/g' .env
  fi
  
  echo "Configuration restored successfully."
else
  echo "Error: .env.example not found at project root."
  exit 1
fi
