# PRESEASON READINESS TESTING FRAMEWORK

Welcome to the **Semi-Sharp Preseason Readiness Testing Framework** documentation. This framework acts as the operational certification layer used to fully validate all major platform subsystems before enabling the 2026 NFL season automation and executing the PostgreSQL relational database cutover process.

---

## 1. ARCHITECTURE & OVERVIEW

The Preseason Readiness Testing Framework is engineered as a robust, decoupled, and safe diagnostic subsystem within the Semi-Sharp Node.js + React.js container stack. It runs comprehensive, high-fidelity integration test suites across the five core application layers, calculating a unified readiness scorecard.

```
       +-------------------------------------------------+
       |           ADMIN EXECUTION DASHBOARD             |
       +-------------------------------------------------+
                                |
                    HTTPS REST API REQUESTS
                                |
                                v
       +-------------------------------------------------+
       |           READINESS TESTING SERVICE             |
       |     (Master Orchestrator / Scorecard Builder)   |
       +-------------------------------------------------+
                                |
       +------------------------+------------------------+------------------------+
       |                        |                        |                        |
       v                        v                        v                        v
+--------------+         +--------------+         +--------------+         +--------------+
|   Workflow   |         |  Scheduler   |         |  Ingestion   |         |  Reporting   |
|   Testing    |         |   Testing    |         |   Testing    |         |   Testing    |
+--------------+         +--------------+         +--------------+         +--------------+
| - Registry   |         | - Registry   |         | - Registry   |         | - Snapshot   |
| - Execution  |         | - Loaders    |         | - Load-Jobs  |         | - Compile    |
| - Idempotency|         | - Metadata   |         | - Run logs   |         | - Store      |
| - Tracking   |         | - Cron calc  |         | - Validation |         | - Retrieval  |
+--------------+         +--------------+         +--------------+         +--------------+
                                                                                  |
                                                                                  v
                                                                           +--------------+
                                                                           |    Export    |
                                                                           |   Testing    |
                                                                           +--------------+
                                                                           | - DOCX-Word  |
                                                                           | - HTML Web   |
                                                                           | - Artifacts  |
                                                                           +--------------+
```

---

## 2. TESTING FLOW

When the admin initiates a certification run (either by loading the Admin Dashboard or clicking **Trigger Full System Certification**):

1. **API Trigger**: Express API Router routes the request to `ReadinessTestingService.runFullCertification()`.
2. **Parallel/Sequential Subsystem Execution**:
   - `WorkflowTestingService`: Validates registry operations, dry-run executes a dummy workflow run, verifies active state tracking updates, tests idempotency deduplication rules, and tests transaction completion.
   - `SchedulerTestingService`: Verifies schedule loading, analyzes cron next-run calculation offsets, asserts metadata formats, and validates schedule activation status keys.
   - `IngestionTestingService`: Scans adapter registries, lists data sources, tests structured validators with correct and warning payload arrays, and checks audit trailing structures.
   - `ReportingTestingService`: Sources active contest legs (with high-fidelity seeding fallbacks), converts simulation summaries into structured markdown, processes narratives, hashes outputs, and stores/retrieves compiled reports.
   - `ExportTestingService`: References compiled reports to produce Microsoft Word (DOCX) files, compiles responsive HTML templates, packages studies as Research Artifacts, and scans the physical archive registry.
3. **Scorecard Synthesis**: Collects all results, applies weighted math coefficients, collects warnings and actionable operational recommendations, and creates a `SystemReadinessScorecard` payload returned as a JSON structure.

---

## 3. SUBSYSTEM VALIDATION METHODOLOGY

### A. Workflow Subsystem
- **Registry & History**: Tests if `workflowRunRepo` responds with valid collections.
- **Dry-Run Runner**: Starts a mock run `IMPORT_ONLY` with the `force` flag set to prevent collision with actual runs.
- **Idempotency Deduplication**: Simulates a duplicate thread trigger to ensure the engine intercepts duplicate triggers and extracts the existing run ID.
- **Transition Updates**: Mutates the status parameter directly and verifies successful storage updates.

### B. Scheduler Subsystem
- **Registry Connection**: Confirms the active `IScheduledWorkflowRepository` exposes list/save contracts.
- **Metadata Assertions**: Invokes the `ScheduleValidationService` against standard test models.
- **Cron Calculation**: Feeds `ScheduledWorkflowService.calculateNextRun()` with cron benchmarks like `15 8 * * 4` (Thursdays 8:15 AM) and verifies it calculates future dates.

### C. Data Ingestion Subsystem
- **Source Registry**: Audits `listSources()` outputs.
- **Payload Verification**: Verifies `ImportValidationService.validatePayload()` handles correct schemas with `valid: true` and empty arrays with warnings metadata.
- **Auditing Integrity**: Asserts that `ImportAuditService` stamps runs with system environment details and traces.

### D. Reporting Subsystem
- **Self-Seeding Logic**: If no active contest legs exist in the database, automatically registers a temporary Week 1 NFL preseason leg.
- **Narrative Building**: Compiles simulated win probabilities and popularity into sections using the narrative engine.
- **Audit Cryptography**: Runs a cryptographic hash calculations check to certify report content integrity.

### E. Export & Artifact Subsystem
- **DOCX Generation**: Converts reports into Word sections using `DocxExportService`.
- **HTML Compiling**: Generates responsive web templates using `HtmlExportService`.
- **Packaging**: Builds Survivor Strategy Research Artifact portfolios and registers them in the persistent archive registry.

---

## 4. DESIGN OF READINESS SCORING

To prevent overconfidence, each subsystem scoring ranges from `0` to `100` based on the percentage of passed criteria. The overall score is calculated as a weighted average using the coefficients below:

| Subsystem Component | Weight Coefficient | Vitality / Impact |
| :--- | :---: | :--- |
| **Workflow Engine** | **25%** | Controls live run safety and task sequences. |
| **Scheduler Engine** | **20%** | Governs automated trigger precision. |
| **Data Ingestion** | **20%** | Crucial for correct game lines, injury logs, and rosters. |
| **Weekly Reports** | **15%** | Computes the strategic survivor recommendations. |
| **Export Compilers** | **20%** | Responsible for packaging research artifacts. |

### Certification Thresholds:
- **`READY`** (Overall Score $\ge 90$): System is optimized, robust, and certified for live full-season execution.
- **`NEEDS_ATTENTION`** ($70 \le$ Overall Score $< 90$): Basic functions are active but non-fatal warnings exist.
- **`NOT_READY`** (Overall Score $< 70$): Enforced if vital subsystems fail checks. Live production execution is locked.

---

## 5. OPERATIONAL CERTIFICATION CHECKLIST

Before launching the 2026 Season, complete this operational checklist:

- [ ] **Run Core Certifications**: Verify Overall Score is $\ge 90\%$.
- [ ] **Audit Warnings**: Ensure zero `CRITICAL` or `FAILED` subsystem indicators on the dashboard console.
- [ ] **Confirm Timezone Alignment**: Verify that the environment timezone is set to `America/New_York` so cron calculations match NFL game times.
- [ ] **Check Ingestion Adapters**: Confirm that ingestion sources resolve and pull proper values without timeouts.
- [ ] **Verify AI Model Aliases**: Ensure that `gemini-3.5-flash` or the active GenAI workspace configuration key is set and responsive.

---

## 6. FUTURE POSTGRESQL CUTOVER CHECKLIST

Once the Preseason Readiness tests pass successfully under `USE_MOCK=true`, follow this checklist to safely migrate to the persistent SQL layer:

1. **Environment Setup**:
   - Set up standard Cloud SQL instance using port 3000 mapping parameters.
   - Declare valid database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_NAME`) in the container settings.
2. **Database Verification**:
   - Access the Admin Dashboard and verify **PostgreSQL Cutover Readiness Validation** status.
   - Run Schema validation to ensure schemas and table formats are fully recognized.
3. **Switch Environment Key**:
   - Toggle `USE_MOCK=false` in the environment settings file (`.env` or Cloud Run environment variables).
4. **Trigger Live Cutover Validation**:
   - Restart the server.
   - Return to the Admin Dashboard and rerun **Preseason Readiness Certification**.
   - Verify overall status is restored to **`READY`** over real PostgreSQL database repository instances.
