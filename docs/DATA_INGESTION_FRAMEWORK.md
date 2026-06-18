# Data Ingestion Framework

The **Data Ingestion Framework** defines the structural rules, validation pipelines, and adapter drivers for bringing external NFL datasets (Matchups, Weather, Injuries, and Odds Lines) securely into the Semi-Sharp platform.

---

## 1. Architectural Design

```
                  [ Admin Dashboard Web GUI ]
                              │
                              ▼  (Core Fetch Requests)
                     [ Router Rest Endpoints ]
                              │
                              ▼
                  [ DataIngestionService ] 
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
[ ImportValidationService ] [ AdapterRegistry ] [ ImportAuditService ]
                              │
                              ├─► ScheduleAdapter (NFL Schedule)
                              ├─► TeamAdapter (Division Profilers)
                              ├─► InjuryAdapter (Player Report)
                              ├─► LineAdapter (Odds Lines)
                              └─► WeatherAdapter (Stadium Environmental)
```

The layers include:
1. **API Router Endpoints**: Formulates responses, parses route bindings, and maps input variables. Mounted under `/api/ingestion/*` routing prefixes in `backend/routes/api.ts`.
2. **Ingestion Service**: Orchestrates lifecycle commands (such as creating source registries, defining mapping tasks, and executing manual runs).
3. **Validation Engine**: Performs schema verification, verifies state attributes, and executes pre-conditions constraint audits.
4. **Adapter Driver Registry**: Allocates, identifies, and registers specialized transport adapters matching external payloads.
5. **Audit Logger Service**: Records execution progress traces, records statistics (Processed, Imported, Rejected), and maps trace errors.
6. **Repository Contracts**: Standardizes operations across memory arrays or relational databases.

---

## 2. Shared Adapter Contract

Every adapter must implement the contractual interface `IAdapter` declared inside `backend/ingestion/adapters/BaseAdapter.ts`:

### Key Interface Methods:
- `validateConnection()`: Verifies endpoint credentials, validates handshake response, and tests server network status.
- `fetchData()`: Fetches raw, unstructured data payloads.
- `transform(rawData)`: Maps unstructured fields (e.g. `raw_away`, `consensus_spread`) to structured internal TypeScript models.
- `validatePayload(payload)`: Examines raw feeds before committing, catching structural or format anomalies.
- `buildImportResult(...)`: Synthesizes diagnostic traces, log counts, and error lists into a standard run output.

---

## 3. Core Data & Domain Models

All domain objects are modeled inside `backend/ingestion/models/index.ts`:

- **DataSource**: Represents an upstream target or provider configuration.
  ```typescript
  interface DataSource {
    id: string;
    name: string;
    description: string;
    adapterType: string; // matches registered adapter
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
  }
  ```
- **ImportJob**: Binds a DataSource provider to an import pipeline mapping.
  ```typescript
  interface ImportJob {
    id: string;
    name: string;
    description: string;
    importType: ImportType; // SCHEDULE | TEAM | INJURY | LINE | WEATHER | CUSTOM
    sourceId: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
  }
  ```
- **ImportRun**: Logs a single run execution trace.
  ```typescript
  interface ImportRun {
    id: string;
    jobId: string;
    importType: ImportType;
    status: ImportStatus; // PENDING | RUNNING | SUCCEEDED | FAILED | PARTIAL_SUCCESS | CANCELLED
    startedAt: Date;
    completedAt: Date | null;
    recordsProcessed: number;
    recordsImported: number;
    recordsRejected: number;
    errorMessage: string | null;
    auditMetadata: ImportAuditMetadata;
  }
  ```

---

## 4. Ingestion Validation Flow

To safeguard platform predictability, all incoming datasets pass through multi-stage validations in `ImportValidationService`:

```
               [ Raw Inbound Feed Array ]
                           │
                           ▼  [ Stage 1: Array-Type Verification ]
               Is Array? (Fails if Object/Null)
                           │
                           ▼  [ Stage 2: Empty Data warnings ]
                Warm with empty payload warn
                           │
                           ▼  [ Stage 3: Adapter validatePayload() ]
             Run-level customized field checks (e.g. types match)
                           │
                           ▼
                  [ Clean Structured Data ]
```

---

## 5. Execution Workflow Pipeline

When an administrator clicks **Run Import** in the administrative dashboard, the following sequence runs synchronously:

1. **Resolution**: Loads Job parameters and checks associated DataSource configuration.
2. **Pre-Flight Validation**: Asserts that both Job and source are state-enabled.
3. **Trace Creation**: Creates a new `ImportRun` tracking identifier (`run_im_***`) with `ImportStatus.RUNNING`.
4. **Adapter Resolution**: Instantiates the matching driver from the `AdapterRegistryService`.
5. **Connection Test**: Checks server network response via `adapter.validateConnection()`.
6. **Fetch & Transform**: Fetches raw JSON records and transforms fields to internal platform entities.
7. **Validation checks**: Audits result values through the `ImportValidationService`.
8. **Finalization Write**: Saves imported records, sets complete dates, logs audit footprint, and saves the final run status (e.g. `SUCCEEDED` or `FAILED`).

---

## 6. Integrations & Relational Roadmaps

### Future Real API Integrations:
- **NFL Schedules**: Hooking to RapidAPI or Sportradar endpoints.
- **Injury Services**: Consuming official team practice reports from NFL GSIS or scraping public ESPN injury logs under robust proxy backends.
- **Weather forecasts**: Polling NOAA JSON services for games played in open stadium venues.
- **Bookmaker Odds lines**: Connecting to the Odds API to fetch point spread movements.

### Relational Database Roadmap:
When ready to scale, the in-memory `MockIngestionRepository` is swapped with a persistent PostgreSQL database using Drizzle:

```sql
CREATE TABLE IF NOT EXISTS "ingestion_sources" (
  "id" varchar PRIMARY KEY,
  "name" varchar NOT NULL,
  "description" text,
  "adapter_type" varchar NOT NULL,
  "enabled" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "ingestion_jobs" (
  "id" varchar PRIMARY KEY,
  "name" varchar NOT NULL,
  "description" text,
  "import_type" varchar NOT NULL,
  "source_id" varchar REFERENCES "ingestion_sources"("id"),
  "enabled" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "ingestion_runs" (
  "id" varchar PRIMARY KEY,
  "job_id" varchar REFERENCES "ingestion_jobs"("id"),
  "import_type" varchar NOT NULL,
  "status" varchar NOT NULL,
  "started_at" timestamp DEFAULT now(),
  "completed_at" timestamp,
  "records_processed" integer NOT NULL,
  "records_imported" integer NOT NULL,
  "records_rejected" integer NOT NULL,
  "error_message" text,
  "audit_metadata" jsonb
);
```

---

## 7. Limitations & Core Safeguards

1. **Data Volatility**: Repository metrics reside inside memory state matrices, resetting to default states upon container warm restarts.
2. **Decoupled Architecture**: No mock data writes to core tables (`contests`, `teams`), protecting critical calculations and preventing simulation corruptions.
3. **Dry-Run Default**: Handshake calculations simulate live response mappings, eliminating API pricing charges or unexpected proxy disconnections.
