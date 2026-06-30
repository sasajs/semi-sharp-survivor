#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==============================================="
echo " Semi-Sharp Database Validation"
echo "==============================================="

if [ ! -f .env ]; then
  echo "✗ .env file not found."
  exit 1
fi

set -a
source .env
set +a

DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "✗ DATABASE_URL is not set in .env"
  exit 1
fi

echo ""
echo "1) PostgreSQL connection"
psql "$DB_URL" -c "SELECT NOW();" >/dev/null
echo "✓ PostgreSQL reachable"

echo ""
echo "2) Required table checks"

psql "$DB_URL" -c "SELECT 1 FROM contest_types LIMIT 1;" >/dev/null
echo "✓ contest_types table exists"

psql "$DB_URL" -c "SELECT contest_type_id FROM survivor_entries LIMIT 1;" >/dev/null
echo "✓ survivor_entries.contest_type_id exists"

echo ""
echo "3) Contest Type seed checks"

circa_count=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM contest_types WHERE code = 'CIRCA';")
standard_count=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM contest_types WHERE code = 'STANDARD';")

if [ "$circa_count" = "1" ]; then
  echo "✓ CIRCA contest type exists"
else
  echo "✗ CIRCA contest type missing"
  exit 1
fi

if [ "$standard_count" = "1" ]; then
  echo "✓ STANDARD contest type exists"
else
  echo "✗ STANDARD contest type missing"
  exit 1
fi

echo ""
echo "4) Entry contest type integrity"

null_entries=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM survivor_entries WHERE contest_type_id IS NULL;")

if [ "$null_entries" = "0" ]; then
  echo "✓ No survivor entries have NULL contest_type_id"
else
  echo "✗ $null_entries survivor entries have NULL contest_type_id"
  exit 1
fi

echo ""
echo "5) Active migration check"

psql "$DB_URL" -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;" || true

echo ""

echo ""
echo "6) Required seeded data checks"

contest_count=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM contests;")
entry_count=$(psql "$DB_URL" -t -A -c "SELECT COUNT(*) FROM survivor_entries;")

if [ "$contest_count" -lt "1" ]; then
  echo "✗ No contests found"
  exit 1
else
  echo "✓ Contests found: $contest_count"
fi

if [ "$entry_count" -lt "1" ]; then
  echo "✗ No survivor entries found"
  exit 1
else
  echo "✓ Survivor entries found: $entry_count"
fi

echo "==============================================="
echo " Database Validation Complete"
echo "==============================================="
