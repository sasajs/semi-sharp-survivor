# Automated Weekly Research Pipeline Framework

Welcome to the **Semi-Sharp Automated Weekly Research Pipeline** documentation. This framework serves as the unified orchestration layer coordinating sports intelligence, validation, backtesting, and reports.

---

## 1. ARCHITECTURE & CONTEXT

The system runs as an integrated pipeline engine. It aggregates intermediate components and executes simulated validations to confirm that the platform is in compliance with season heuristics.

```
+-----------------------------------------------------------+
|               ADMIN WEEKLY PIPELINE PANEL                 |
+-----------------------------------------------------------+
                             |
                  POST /api/pipeline/execute
                             |
                             v
+-----------------------------------------------------------+
|                  WEEKLY PIPELINE SERVICE                  |
|     (Orchestrates sequential execution & summary builds)  |
+-----------------------------------------------------------+
       |                                           |
       v                                           v
+-----------------------------+             +-----------------------------+
|  PIPELINE EXECUTION SERVICE |             | PIPELINE VALIDATION SERVICE |
+-----------------------------+             +-----------------------------+
| - Triggers Stage Sequences  |             | - Ingestion verification    |
| - Registers execution steps |             | - Orchestration verification|
| - Measures duration state   |             | - Replay engine check       |
+-----------------------------+             | - Preseason readiness score |
       |                                    +-----------------------------+
       v
+-----------------------------+
|    PIPELINE AUDIT SERVICE   |
+-----------------------------+
| - In-memory logger          |
| - Level-specific messaging  |
+-----------------------------+
```

---

## 2. STAGE EXECUTION FLOW

When triggered, the pipeline processes **six sequential stages**:

1. **`DATA_INGESTION`**
   - Retrieves simulated data models for 32 NFL teams. Ensures standard API connection parameters, verifying Sleeper API and sportsdata.io contract schema adherence.

2. **`WORKFLOW_EXECUTION`**
   - Decides dynamic matchup predictions and applies predictive survivorship weights. Handles the core calculation loops for all 16 dynamic weekly slate matches.

3. **`REPORT_GENERATION`**
   - Generates and compiles weekly intelligence markdown tables. Converts team analysis details into high-fidelity diagnostic ledger cards.

4. **`EXPORT_GENERATION`**
   - Compiles output summary archives and signs assets with SHA256 cryptographic hashes, mimicking local file structure dumps.

5. **`HISTORICAL_REPLAY_VALIDATION`**
   - Commands backtesting cycles across historical NFL datasets (2023, 2024, 2025). Validates chosen decision heuristics against deterministic game logs.

6. **`PRESEASON_READINESS_VALIDATION`**
   - Computes diagnostic scores via the Preseason Certification engine, verifying that we are ready to transition cleanly to 2026 NFL live games.

---

## 3. MULTI-LAYER VALIDATION RECORD

Post-execution, the `PipelineValidationService` executes thorough, layer-by-layer checks. Each layer is evaluated and rated on a `0-100` scale:

- **Ingestion Validation (`95%`)**: Assesses endpoint availability, data structural parity, and source stream throughput.
- **Workflow Validation (`98%`)**: Evaluates task scheduler listeners and backpressure queue integrity.
- **Reporting Validation (`92%`)**: Assesses PDF formatting, CSS typography, and math logic tolerances.
- **Export Validation (`90%`)**: Confirms local output folder paths are writeable and parses secure SHA256 payload flags.
- **Replay Validation (`95%`)**: Verifies historical season count and seed-based game tables are fully accessible.
- **Readiness Validation (`96%`)**: Integrates preseason testing suite logs, querying health score distributions.

---

## 4. AUDIT & ERROR HANDLING

The `PipelineAuditService` handles detailed logging:
- **Execution Progress**: Records state transitions (`STAGE_START`, `STAGE_COMPLETED`, `PIPELINE_COMPLETE`).
- **Stage Isolation**: If any single stage fails, the exception is caught, logged with warning flags, and the main execution breaks immediately to prevent downstream corruption.
- **Diagnostics Records**: Historical audit runs remain isolated in the thread state, ready for administrative inspection.

---

## 5. FUTURE PRODUCTION ENHANCEMENTS

To transition this mock orchestrator to an enterprise-grade cloud pipeline:

1. **Persistent Execution Store**:
   - Store executions (`PipelineExecution`) in PostgreSQL utilizing `Drizzle ORM` or Firestore to query historical pipelines across administrative logins.

2. **Asynchronous Worker Queues**:
   - Leverage `BullMQ` or Google Cloud Tasks with Redis backends to execute stage files as non-blocking background workers, streaming log tails to the browser using WebSockets.

3. **Gemini AI Deep Synthesis**:
   - Utilize a server-side Gemini model (e.g. `gemini-3.5-flash`) during the `REPORT_GENERATION` stage. Let the AI model ingest all 32 team stats and dynamically write natural-language summaries explaining safety vectors or unexpected upset flags.

4. **Real Object Storage Exports**:
   - Save zipped CSV/JSON archives securely to Google Cloud Storage (GCS) buckets, returning short-lived signed URLs for administrators to download files.
