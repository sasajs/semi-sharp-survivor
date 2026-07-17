#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PROJECT_DIR="$(cd "${BACKEND_DIR}/.." && pwd)"

DOCUMENTATION_DIR="${PROJECT_DIR}/Documentation"
ARCHIVE_DIR="${PROJECT_DIR}/Archive"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"

DOC_ARCHIVE_DIR="${ARCHIVE_DIR}/documentation"
CODE_ARCHIVE_DIR="${ARCHIVE_DIR}/code_backups/${TIMESTAMP}"
LOG_ARCHIVE_DIR="${ARCHIVE_DIR}/logs"
LOG_FILE="${LOG_ARCHIVE_DIR}/refresh_and_test_${TIMESTAMP}.log"

mkdir -p \
    "${DOC_ARCHIVE_DIR}" \
    "${CODE_ARCHIVE_DIR}" \
    "${LOG_ARCHIVE_DIR}"

exec > >(tee -a "${LOG_FILE}") 2>&1

on_error() {
    local exit_code=$?

    echo
    echo "============================================================"
    echo "REFRESH AND TEST FAILED"
    echo "Exit code: ${exit_code}"
    echo "Log: ${LOG_FILE}"
    echo "============================================================"

    exit "${exit_code}"
}

trap on_error ERR

echo "============================================================"
echo "SemiSharp Documentation Refresh and Regression"
echo "============================================================"
echo "Timestamp:     ${TIMESTAMP}"
echo "Project:       ${PROJECT_DIR}"
echo "Backend:       ${BACKEND_DIR}"
echo "Documentation: ${DOCUMENTATION_DIR}"
echo "Archive:       ${ARCHIVE_DIR}"
echo "Log:           ${LOG_FILE}"
echo

cd "${BACKEND_DIR}"

if [[ ! -f "${BACKEND_DIR}/.venv/bin/activate" ]]; then
    echo "ERROR: Python virtual environment was not found:"
    echo "${BACKEND_DIR}/.venv/bin/activate"
    exit 1
fi

# shellcheck disable=SC1091
source "${BACKEND_DIR}/.venv/bin/activate"

echo "Python:"
python3 --version
echo

# -------------------------------------------------------------------
# 1. Archive the current documentation before regeneration
# -------------------------------------------------------------------

if [[ -d "${DOCUMENTATION_DIR}" ]]; then
    DOC_ARCHIVE_FILE="${DOC_ARCHIVE_DIR}/Documentation_${TIMESTAMP}.tar.gz"

    echo "Archiving current documentation..."
    echo "Destination: ${DOC_ARCHIVE_FILE}"

    tar \
        --exclude='Documentation/Secrets' \
        --exclude='Documentation/Secrets/**' \
        --exclude='Documentation/.~lock.*' \
        --exclude='Documentation/*.tmp' \
        -czf "${DOC_ARCHIVE_FILE}" \
        -C "${PROJECT_DIR}" \
        Documentation

    echo "Documentation archive created."
else
    echo "Documentation directory does not exist; skipping archive."
fi

echo

# -------------------------------------------------------------------
# 2. Move loose development backup files into Archive
# -------------------------------------------------------------------

echo "Looking for loose development backup files..."

BACKUP_COUNT=0

while IFS= read -r -d '' file; do
    relative_path="${file#${BACKEND_DIR}/}"
    destination="${CODE_ARCHIVE_DIR}/${relative_path}"

    mkdir -p "$(dirname "${destination}")"
    mv "${file}" "${destination}"

    echo "Archived: ${relative_path}"
    BACKUP_COUNT=$((BACKUP_COUNT + 1))
done < <(
    find \
        "${BACKEND_DIR}/app" \
        "${BACKEND_DIR}/scripts" \
        -type f \
        \( \
            -name '*.before_*' \
            -o -name '*.backup_*' \
            -o -name '*.placeholder_backup.py' \
            -o -name '*_backup_before_*.py' \
        \) \
        -print0 2>/dev/null
)

if [[ "${BACKUP_COUNT}" -eq 0 ]]; then
    echo "No loose development backup files found."
else
    echo "Archived ${BACKUP_COUNT} backup file(s) to:"
    echo "${CODE_ARCHIVE_DIR}"
fi

echo

# -------------------------------------------------------------------
# 3. Remove stale editor lock files only
# -------------------------------------------------------------------

echo "Removing stale documentation editor lock files..."

find "${DOCUMENTATION_DIR}" \
    -maxdepth 1 \
    -type f \
    -name '.~lock.*' \
    -print \
    -delete 2>/dev/null || true

echo

# -------------------------------------------------------------------
# 4. Regenerate documentation
#
# generate_system_snapshot.py already invokes:
# - scripts/database/generate_database_dictionary.py
# - scripts/documentation/generate_api_catalog.py
# -------------------------------------------------------------------

echo "============================================================"
echo "GENERATING SYSTEM DOCUMENTATION"
echo "============================================================"

python3 scripts/documentation/generate_system_snapshot.py

echo
echo "Documentation generation completed."

# -------------------------------------------------------------------
# 5. Compile recently changed backend modules before regression
# -------------------------------------------------------------------

echo
echo "============================================================"
echo "PYTHON COMPILE CHECK"
echo "============================================================"

python3 -m py_compile \
    app/api/reference.py \
    app/api/strategies.py \
    app/api/team_aliases.py \
    app/services/home_field_advantage_service.py \
    app/services/reference_service.py \
    scripts/tests/regression_test.py

echo "Compile check passed."

# -------------------------------------------------------------------
# 6. Run the full regression suite
# -------------------------------------------------------------------

echo
echo "============================================================"
echo "RUNNING REGRESSION SUITE"
echo "============================================================"

python3 scripts/tests/regression_test.py

echo
echo "Regression suite passed."

# -------------------------------------------------------------------
# 7. Show generated documentation and repository state
# -------------------------------------------------------------------

echo
echo "============================================================"
echo "GENERATED DOCUMENTATION"
echo "============================================================"

for file in \
    "${DOCUMENTATION_DIR}/API_CATALOG.md" \
    "${DOCUMENTATION_DIR}/database_dictionary.txt" \
    "${DOCUMENTATION_DIR}/database_dictionary.json" \
    "${DOCUMENTATION_DIR}/semisharp_directory_structure.txt"
do
    if [[ -f "${file}" ]]; then
        stat \
            --printf='%y  %s bytes  %n\n' \
            "${file}"
    else
        echo "MISSING: ${file}"
    fi
done

echo
echo "============================================================"
echo "GIT STATUS"
echo "============================================================"

cd "${PROJECT_DIR}"
git status --short

echo
echo "============================================================"
echo "REFRESH AND TEST COMPLETE"
echo "============================================================"
echo "Documentation archive:"
echo "${DOC_ARCHIVE_DIR}/Documentation_${TIMESTAMP}.tar.gz"
echo
echo "Archived code backups:"
echo "${CODE_ARCHIVE_DIR}"
echo
echo "Execution log:"
echo "${LOG_FILE}"
