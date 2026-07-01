# Developer Workflow & Validation Guidelines

This document outlines the standard install, validation, and local development workflows for Semi-Sharp V2, focusing on the Data Operations Center.

## 1. Standard Developer Workflow

To set up your local development environment and run the full validation suite:

```bash
# 1. Restore local environment configuration
./scripts/restore-local-config.sh

# 2. Install all package dependencies
npm install

# 3. Run the complete automated validation suite
npm run validate:all

# 4. Start the local development server (binds to port 3000)
npm run dev
```

---

## 2. Validation Suite Scripts

The validation framework consists of three target scripts orchestrated by the regression suite:

### A. Regression Suite (`scripts/regression-suite.sh`)
Orchestrates the entire validation flow by:
- Launching a temporary, process-tracked background server.
- Monitoring server startup logs for key initialization and relational signals.
- Triggering secondary validation scripts (`db-validation.sh` and `api-validation.sh`).
- Running a robust, process-aware `trap` on exit (success or failure) to cleanly stop the temporary server and verify that local ports (such as **3000**) are completely free.

### B. Database Seed Integrity (`scripts/db-validation.sh`)
Ensures that the seeded database complies with core business rules and relational constraints:
- Verifies that no orphaned or detached records exist across feature metrics.
- Checks `weekly_inputs.team_id`, `team_features.team_id`, `game_features.game_id`, `game_features.home_team_id`, and `game_features.away_team_id` for structural integrity.

### C. API Endpoint Integrity (`scripts/api-validation.sh`)
Verifies live API endpoint integrity:
- Checks `/api/entries` to ensure it returns non-empty entries.
- Checks `/api/owners` to ensure it returns non-empty owners.
- Checks `/api/contest-types` to ensure it returns valid types including `CIRCA` and `STANDARD`.
- Checks `/api/roadmaps` to ensure it returns valid roadmap dictionary structures.
- Checks `/api/recommendations` to tolerate empty query parameters gracefully (handling 400 Bad Request status codes gracefully).
- Validates that the system health endpoint (`/api/system/health`) reports the database mode as `postgres` (not `mock`) when `USE_MOCK=false`.

---

## 3. Database Fallback & Fallback Triggers

To prevent silent failures where the server falls back to mock mode while appearing to boot successfully:
- When `USE_MOCK=false`, validation **requires** a healthy PostgreSQL connection, complete migrations, and complete seeding.
- Validation **MUST fail** if the startup logs contain:
  - `[Database Fallback]`
  - `mock-sandbox`
  - `Activating mock persistence`
- Successful validation requires these explicit log indicators:
  - `PostgreSQL connection, migrations, and seeding completed successfully`
  - `DB: postgres`
  - `Repository mode selected: RELATIONAL POSTGRES`

---

## 4. Import Folder Git Exclusions & Fixtures

To keep the repository clean and avoid committing operational or transactional CSVs:
- **Git Policy**: Live operational directories are ignored in `.gitignore`, but their structure is preserved in git using `.gitkeep` files:
  - `imports/**/pending/`
  - `imports/**/processed/`
  - `imports/**/rejected/`
- **Fixture Location**: Sample files or template CSVs used for reference, testing, or seeding are moved out of live import folders to a dedicated fixture folder:
  - `tests/fixtures/imports/`

---

## 5. Cleaning Up Stuck Dev Servers

If a local server process becomes stuck, or you encounter port conflicts (on port **3000** or port **24678**):
- Run the cleanup helper script:
  ```bash
  ./scripts/stop-local-server.sh
  ```
- This script finds all running tsx/server.ts processes, terminates them cleanly, and verifies that ports 3000 and 24678 are free.
