# PostgreSQL Readiness Validation Layer and Cutover Guide

This document describes the design, operation, and roadmap of the **PostgreSQL Readiness Validation Layer** implemented in the platform.

The validation layer guarantees that all repositories, database credentials, schema migration scripts, and express connection drivers are verified and compliant prior to executing cutover.

---

## 1. Architectural Integrity

The system operates safely with **zero active database handshake requirements** by default under local sandboxed states (`USE_MOCK=true`). This prevents startup failures, timeout bottlenecks, and live-connection issues. The validation layer allows developers to dynamically audit:

1. **Repository Polymorphism**: Proves `RepositoryFactory` resolves all repository constructs and maps Postgres-specific drivers flawlessly.
2. **Schema Registries Validation**: Scans physical filesystems to ensure each schema SQL script (from initialization version `V001` onwards) is present on disk with appropriate serial prefixes.
3. **Connection Pool Diagnostics**: Analyzes connection bounds (`DB_POOL_MIN`, `DB_POOL_MAX`, and `DB_CONNECT_TIMEOUT`) inside current configurations without establishing network sockets.
4. **Environment Profiles Checks**: Confirms critical variables like `DATABASE_URL` exist with proper characters.

---

## 2. Directory & Service Components

The readiness suite is organized underneath the `/backend/postgres/` directory tree:

```
/backend/postgres/
├── models/
│   └── index.ts                 # Type definitions and system report fields
└── services/
    ├── ConnectionValidationService.ts # Environment settings configurations and connection pool validator
    ├── MigrationValidationService.ts  # Schema directories and SQL prefix sequence tracking
    ├── RepositoryValidationService.ts # Dynamic verification of repository contract compatibility
    └── PostgresValidationService.ts  # Master orchestration layer compiling unified reports
```

### Validation Endpoints (API)

The backend registers four verification endpoints prefixing `/api`:

*   `GET /system/postgres-readiness`: Generates the complete aggregated readiness report containing all four checklists, active warnings, and recommendations.
*   `GET /system/postgres-validation`: Focuses purely on basic environment variables checks.
*   `GET /system/repository-validation`: Reviews active `RepositoryFactory` instances and verifies interface bindings.
*   `GET /system/migration-validation`: Runs checklist audits over database schema files and sequence orderings.

---

## 3. High-Fidelity Admin Dashboard

The **PostgreSQL Cutover Readiness Panel** is mounted in Section `03` of the secure admin page (`/src/pages/AdminDashboard.tsx`). 

### Core Sections
*   **Bento Status Matrix**: Instantly view metrics for Repository resolution, Migration counts, Pool limits, and Active Modes.
*   **Tabs Interface**:
    *   *Audit Summary*: Key status indicators, warning feeds, and dry-run safety explanations.
    *   *Repository Registries*: Explicit breakdowns of physical repositories and their instantiators (Mock vs. Postgres).
    *   *Migration Files*: Validated listing of SQL files, confirming existence and V001 cornerstone schema structure.
    *   *Pool Config*: Inspects pool sizes and timeouts.
    *   *Recommendations*: Actionable checklist for deploying PostgreSQL, resolving firewall rules, and completing production steps.
*   **Trigger Re-audit**: Allows the operator to trigger real-time re-audits instantly.

---

## 4. Production Cutover Preparation Roadmap

Follow these 4 steps to migrate the platform from mock arrays to live relational storage:

### Step 1: Provision Cloud Database
Create an enterprise-grade database instance on Google Cloud SQL (PostgreSQL engine) or a compatible fully managed Postgres host.

### Step 2: Configure Environment Settings
Add the database variables to your live environment configuration or write them into a secure workspace:
```env
USE_MOCK=false
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_CONNECT_TIMEOUT=15000
```

### Step 3: Seed Schemas
Execute migration and seeder commands inside the container environments to run active SQL schemas:
```bash
npx tsx backend/database/migrations/runMigrations.ts
npx tsx backend/database/seed/seedData.ts
```

### Step 4: Verify Live Metrics
Launch the Application and navigate to the **Infrastructure Live Monitor** and **PostgreSQL Cutover Readiness** sections on the Admin Dashboard to confirm all handshakes are active, state persistent, and status indicators show healthy.
