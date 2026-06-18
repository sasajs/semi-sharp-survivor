# Scheduled Workflow Engine

The **Scheduled Workflow Engine** defines, lists, enables, disables, and manually triggers automated platform workflows within the Semi-Sharp environment. This engine establishes the structural foundation for scheduling tasks while relying on the existing, robust `WorkflowOrchestratorService` to process workflow runs securely.

---

## Architecture Overview

```scss
[ Admin Dashboard React App ]
            │
            ▼  (Fetch API layer)
[ Express API Router Routes ]  -----> [ HealthCheckService (schedulerLayer check) ]
            │
            ▼
[ ScheduledWorkflowService ] <-----> [ ScheduleValidationService ]
            │
            ├─► [ ScheduleAuditService (Audit Records) ]
            │
            ├─► [ IScheduledWorkflowRepository (Abstract Mock State Store) ]
            │
            └─► [ WorkflowOrchestratorService (Delegated Executions) ]
```

The system comprises the following loosely coupled layers:
1. **Model & DTO definitions** (`backend/scheduler/models/index.ts`): Holds formal TypeScript declarations for enums (`ScheduleStatus`, `ScheduleTriggerType`), properties, and transfer objects.
2. **Repository Abstraction** (`backend/scheduler/repositories/`):
   - `IScheduledWorkflowRepository`: Formally defines data access operations.
   - `MockScheduledWorkflowRepository`: Implements an in-memory repository pre-populated with standard game-week scheduling playbooks.
3. **Core Services** (`backend/scheduler/services/`):
   - `ScheduledWorkflowService`: Coordinates schedule updates, calculations, manual triggering, and execution pipelines. Includes crontab next-run approximation logic.
   - `ScheduleValidationService`: Validates cron syntax constraints, NFL season/week parameters, and workflow types.
   - `ScheduleAuditService`: Records auditable operation logs (blueprints, updates, results, errors).

---

## Core API Endpoints

All scheduler-specific endpoints are registered inside `backend/routes/api.ts` under the primary `/api` mounting prefix:

### 1. List All Schedule Blueprints
* **Path**: `GET /api/scheduler/schedules`
* **Response**: `200 OK` with `ScheduledWorkflowDTO[]` array.

### 2. Get Individual Checklist
* **Path**: `GET /api/scheduler/schedules/:id`
* **Response**: `200 OK` or `404 Not Found`.

### 3. Register New Schedule Blueprints
* **Path**: `POST /api/scheduler/schedules`
* **Payload**:
  ```json
  {
    "name": "Weekly Monday Simulation Pipeline",
    "description": "Triggers Monte Carlo simulations weekly.",
    "workflowType": "FULL_WEEKLY_RESEARCH",
    "season": "2026",
    "week": 1,
    "scheduleExpression": "0 4 * * 1",
    "scheduleTimezone": "America/New_York"
  }
  ```
* **Response**: `201 Created` with created `ScheduledWorkflowDTO`.

### 4. Patch Schedule Properties
* **Path**: `PATCH /api/scheduler/schedules/:id`
* **Payload**: Partial configuration object.
* **Response**: `200 OK` with updated schedule details.

### 5. Transition Rule States
* **Paths**:
  - `POST /api/scheduler/schedules/:id/enable` (Re-calculates `nextRunAt` times)
  - `POST /api/scheduler/schedules/:id/disable` (Nullifies `nextRunAt` times)
  - `POST /api/scheduler/schedules/:id/pause`
* **Response**: `200 OK` with updated `ScheduledWorkflowDTO`.

### 6. Manually Trigger Checklist Rule
* **Path**: `POST /api/scheduler/schedules/:id/trigger`
* **Response**: `200 OK` with initiated `ScheduledWorkflowRunDTO`.

### 7. Extract Execution History Trace Logs
* **Path**: `GET /api/scheduler/schedules/:id/runs`
* **Response**: `200 OK` with list of `ScheduledWorkflowRunDTO` matching this rule identifier.

---

## Manual Trigger Execution Flow

To ensure idempotency and prevent duplicate executions, the manual trigger path leverages the core `WorkflowOrchestratorService` as modeled below:

```
[ User Presses "Manual Run" in Panel ]
                    │
                    ▼
[ API Handler calls ScheduledWorkflowService.triggerScheduleManually() ]
                    │
                    ▼
[ Validates constraints & loads targeted blueprint ]
                    │
                    ▼
[ Formulates a standard WorkflowExecutionRequest: force=true & source=manual ]
                    │
                    ▼
[ Invokes WorkflowOrchestratorService.startWorkflowExecution() ]
                    │
                    ├─► [ Validates and checks deterministic idempotency keys ]
                    ├─► [ Prepares and persists steps: PENDING, RUNNING, etc. ]
                    └─► [ Spawns async runner to decouple Express main event loop ]
                    │
                    ▼
[ Creates local trace: ScheduledWorkflowRun indexed to generated workflowId ]
                    │
                    ▼
[ Performs audit record log registry via ScheduleAuditService & returns run object ]
```

---

## Future Automation Roadmaps

While this current milestone focuses strictly on scheduler foundation, audit logs, and manual trigger support, the architecture is primed for automated daemon/execution integrations:

### 1. In-Process Node-Cron Loop (SaaS & Microservices)
- **Concept**: A simple `node-cron` daemon loop launched within the Express startup phase.
- **Pattern**:
  ```ts
  import cron from "node-cron";
  cron.schedule("*/5 * * * *", async () => {
    // Queries database for ACTIVE schedules whose nextRunAt <= now
    // Dispatches executions via WorkflowOrchestratorService.startWorkflowExecution
  });
  ```

### 2. Linux Systemd Timers (On-Prem / VM Deployment)
- **Concept**: Systemd `.timer` config blocks coupled to a headless command-line executing trigger curl statements.
- **Service Blueprint**:
  ```ini
  [Unit]
  Description=Trigger Semi-Sharp Weekly Workflow
  
  [Timer]
  OnCalendar=Mon *-*-* 04:00:00
  Persistent=true
  
  [Install]
  WantedBy=timers.target
  ```

### 3. GitHub Actions Workflows (Cloud native & CI/CD)
- **Concept**: Scheduled CI workflows triggering the secure platform API router using client credentials or secure bearer tokens.
- **Job Blueprint**:
  ```yaml
  name: Semi-Sharp Weekly Automations
  on:
    schedule:
      - cron: '0 4 * * 1'
  jobs:
    trigger-simulation:
      runs-on: ubuntu-latest
      steps:
        - name: Dispatch Event POST Requests
          run: |
            curl -X POST -H "Authorization: Bearer ${{ secrets.M2M_SECRET_TOKEN }}" \
                 "https://semisharp.internal/api/scheduler/schedules/sched_full_weekly_01/trigger"
  ```

---

## Technical Constraints & Limitations

- **Transient State Retention**: By default, schedules, log traces, and audited records reside within an in-memory repository pool (`MockScheduledWorkflowRepository`). Data state updates will transiently reset upon main server container cold restarts.
- **No Background Daemon Loop**: In alignment with current bounds, automatic time-based cron executors are not active; execution relies on user-initiated manual trigger dispatches.
- **NFL Schedule Coupling**: The scheduler-week validation constraints target Standard NFL seasons (Weeks 1 to 22), blocking out-of-range integer entries.
