# PostgreSQL Migration & Persistence Guide

This guide explains the architecture, switching behavior, configuration setup, and the schema migration runner of the Semi-Sharp V2 relational storage engine.

---

## 1. Architectural System Layout

The Semi-Sharp V2 application uses an adaptive repository pattern capable of working as an in-memory mock engine or as a fully fledged relational PostgreSQL persistent engine.

```
                    ┌────────────────────────┐
                    │      React Frontend    │
                    └───────────┬────────────┘
                                │ (JSON REST API)
                                ▼
                    ┌────────────────────────┐
                    │   Express API Router   │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Repository Factory   │
                    └─────┬────────────┬─────┘
                          │            │
          (USE_MOCK=true) │            │ (USE_MOCK=false)
                          ▼            ▼
               ┌─────────────┐      ┌───────────────────────────┐
               │ Mock Engine │      │ PostgreSQL Repositories    │
               │ (In-Memory) │      │  - PostgresContestRepo    │
               └─────────────┘      │  - PostgresEntryRepo      │
                                    │  - PostgresPickRepo       │
                                    │  - PostgresWorkflowRepo   │
                                    │  - PostgresSnapshotRepo   │
                                    │  - PostgresReportRepo     │
                                    │  - PostgresExportRepo     │
                                    └────────────┬──────────────┘
                                                 │
                                                 ▼
                                    ┌───────────────────────────┐
                                    │ PostgresConnectionManager │
                                    └────────────┬──────────────┘
                                                 │ (pg Connection Pool)
                                                 ▼
                                    ┌───────────────────────────┐
                                    │    PostgreSQL Database    │
                                    └───────────────────────────┘
```

---

## 2. Configuration Options & Environment Variables

All settings are controlled through standard system environment variables loaded via `dotenv`. The defaults are defined in `backend/config/database.ts`:

| Property | Environment Variable | Default Value | Description |
|---|---|---|---|
| Mode Identifier | `USE_MOCK` | `true` | When `true`, all repository singletons work in-memory. Set to `false` for active Postgres mode. |
| Database Connection URL | `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/postgres` | Fully qualified PostgreSQL connection string. |
| Minimum Pool Pool Size | `DB_POOL_MIN` | `1` | Minimum number of idle connections to retain in connection pool. |
| Maximum Pool Pool Size | `DB_POOL_MAX` | `10` | Maximum number of concurrent connections the pool will provision. |
| Connect Timeout Limit | `DB_CONNECT_TIMEOUT` | `5000` | Microsecond threshold for connection attempts before dropping. |

---

## 3. High-Fidelity switching (USE_MOCK Behavior)

The system is designed to run seamlessly on Developer/Local environments without requiring a live PostgreSQL service:

- **When `USE_MOCK=true`**:
  - Main memory tables are seeded using `buildAndSeedMockState()`.
  - The database connection pool is bypassed entirely to avoid startup blockages or crashes.
  - The `/api/system/database` endpoint returns the dynamic schema details with `connected: true` and `databaseType: "mock"`.
  - Application startup completes successfully in milliseconds.

- **When `USE_MOCK=false`**:
  - The connection to the PostgreSQL engine is verified immediately.
  - If the database is unreachable, a warning is logged/health is degraded but the application does not crash.
  - System `MigrationRunner` automatically compares local registry snapshots and executes any pending raw SQL migrations.
  - Initial configuration data is loaded via `/backend/database/seed/seedData.ts`.

---

## 4. The Transactional Schema Migration Runner

The system's native migration engine is defined in `/backend/database/migrations/MigrationRunner.ts` and `/backend/database/migrations/MigrationRegistry.ts`.

### Roll-Forward Only Rule
To prevent data accidents in production, **all migrations run exclusively in roll-forward mode**. Schema rollbacks are handled by generating a brand new sequential forward migration (e.g., `V002_FixIndices.sql`) rather than executing dangerous destructive `DROP` tables scripts.

### Execution Log Flow
1. Check if the table `schema_migrations` exists; if not, compile it.
2. Query `schema_migrations` to find the last successfully completed version.
3. Compare the database state with the registered snapshots in `MigrationRegistry`.
4. Run any pending SQL statements inside a safe transaction block.
5. Record the completed version into `schema_migrations`.

---

## 5. Rollback Strategy & Schema Recovery Mode

When structured recovery is required:

1. **Avoid Destructive Rewrites**: Avoid using rollback scripts that truncate columns or tables unless they represent temporary data.
2. **PostgreSQL Roll-Back Forward Action**: Create a compensation migration under the next sequential version tag.
3. **Recovery Command Checklist**:
   - Backup the target database: `pg_dump DATABASE_URL > dry_run_backup.sql`
   - Test compile the code locally with compensation schema definitions.
   - Deploy build and monitor `MigrationRunner` activity logs.

---

## 6. Future Migration Blueprint Roadmap

Future versions of this foundation intend to support:
- **Drizzle ORM Framework**: Incremental migration to programmatically declare and introspect database schemas.
- **Auto-Scale Connection Limits**: Dynamic adjustment of `DB_POOL_MAX` and connection timeout parameters based on request volume.
- **Audit Logging and Row-Level Version Checks**: Systematic snapshot generation for critical entities directly under database trigger constraints.
