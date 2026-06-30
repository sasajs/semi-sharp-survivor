#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==============================================="
echo " Semi-Sharp Post-Update Validation"
echo "==============================================="

echo ""
echo "1) Git status"
git status --short

echo ""
echo "2) Remove known temporary Studio files"
if [ -f test_rec.ts ]; then
    echo "Removing test_rec.ts..."
    rm test_rec.ts
else
    echo "No temporary test files found."
fi

echo ""
echo "3) Install dependencies"
npm install

echo ""
echo "4) TypeScript validation"
npm run lint

echo ""
echo "5) Production build"
npm run build

echo ""
echo "6) Migration registry"
grep -R "version:" backend/database/migrations/MigrationRegistry.ts | tail -10

echo ""
echo "7) Contest Type migration"
if [ -f backend/database/schema/V060__ContestTypeFoundation.sql ]; then
    echo "✓ V060 Contest Type migration found."
else
    echo "✗ V060 migration missing!"
    exit 1
fi

echo ""
echo "8) Port 3000"

if lsof -i :3000 >/dev/null 2>&1; then

    echo "Port 3000 is currently in use."

    lsof -i :3000

    echo ""

    read -p "Terminate existing server? (y/N): " reply

    if [[ "$reply" =~ ^[Yy]$ ]]; then

        echo "Stopping existing Semi-Sharp server..."

        pkill -f "tsx server.ts" || true
        pkill -f "server.ts" || true

        sleep 2

        if lsof -i :3000 >/dev/null 2>&1; then
            echo "Force killing remaining process..."
            lsof -ti :3000 | xargs -r kill -9
            sleep 1
        fi

        if lsof -i :3000 >/dev/null 2>&1; then
            echo "✗ Port 3000 is STILL occupied."
            lsof -i :3000
            exit 1
        fi

        echo "✓ Port 3000 is now free."

    else

        echo "Leaving existing server running."

    fi

else

    echo "✓ Port 3000 is available."

fi

echo ""
echo "9) Repository sanity checks"

test -f backend/repositories/postgres/PostgresContestTypeRepository.ts
test -f src/components/EntryTable.tsx
test -f src/services/apiService.ts
test -f src/hooks/useAppData.ts

echo "✓ Repository structure verified."

echo ""
echo "10) Local configuration checks"

config_error=0

if ! grep -q "semisharp.steveschilhabel.com" vite.config.ts; then
    echo "✗ vite.config.ts missing semisharp allowed host."
    config_error=1
fi

if ! grep -q "allowedHosts" vite.config.ts; then
    echo "✗ vite.config.ts missing allowedHosts."
    config_error=1
fi

if ! grep -q "\"validate:all\"" package.json; then
    echo "✗ package.json missing validate:all script."
    config_error=1
fi

if ! grep -q "\"validate:regression\"" package.json; then
    echo "✗ package.json missing validate:regression script."
    config_error=1
fi

if [ "$config_error" -ne 0 ]; then
    echo ""
    echo "Run:"
    echo "  ./scripts/restore-local-config.sh"
    exit 1
else
    echo "✓ Local configuration verified."
fi


echo ""
echo "==============================================="
echo " Validation Complete"
echo "==============================================="
echo ""
echo "If validation succeeded:"
echo ""
echo "  npm run dev"
echo ""
echo "Then verify:"
echo "  ✓ Dashboard loads"
echo "  ✓ My Entries"
echo "  ✓ Recommendations"
echo "  ✓ Roadmaps"
echo "  ✓ Reports"
echo "  ✓ Admin Dashboard"
echo ""
echo "Finally:"
echo ""
echo "  git add ."
echo "  git commit -m \"Describe feature\""
echo "  git push"
echo ""
