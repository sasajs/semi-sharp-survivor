# Build Plan – SemiSharp V2

## 1. Purpose

This document defines the **execution plan** for building SemiSharp V2 from an empty repository to a production-ready research system.

It answers:

* What gets built
* In what order
* With what success criteria
* And what is explicitly *not* built yet

The intent is to provide a **low-risk, momentum-preserving path** that avoids premature optimization and architectural rework.

---

## 2. Guiding Build Principles

1. **Contracts before code**

   * Data and interface contracts must exist before implementation

2. **Thin vertical slices**

   * Always prefer an end-to-end path over isolated components

3. **Irreversible work first**

   * Schema, permissions, and immutability rules come early

4. **Intelligence last**

   * Models and agents improve only after the system works

5. **Local-first execution**

   * Everything must run on a single Ubuntu server

---

## 3. Build Phases Overview

| Phase   | Goal                  | Output                       |
| ------- | --------------------- | ---------------------------- |
| Phase 0 | Foundations           | Repo + contracts             |
| Phase 1 | Persistence           | Database schema              |
| Phase 2 | System flow           | End-to-end thin slice        |
| Phase 3 | Baseline intelligence | First real features & models |
| Phase 4 | Decision logic        | Agents v1                    |
| Phase 5 | Evaluation            | Metrics & learning loop      |
| Phase 6 | Presentation          | Reports + website            |

Each phase must complete its acceptance criteria before proceeding.

---

## 4. Phase 0 – Foundations (CURRENT)

### Objectives

* Establish shared understanding
* Freeze system boundaries

### Tasks

* Create repository skeleton
* Write ARCHITECTURE.md
* Write DATA_CONTRACT.md
* Write BUILD_PLAN.md

### Acceptance Criteria

* Repo structure exists
* Contracts are committed to git
* No Python code yet

---

## 5. Phase 1 – Persistence Layer

### Objectives

* Make data immutability real
* Lock in week identity

### Tasks

* Write `db/schema.sql`
* Create reference tables
* Create history tables
* Define primary keys and constraints
* Create reader vs writer DB roles

### Acceptance Criteria

* Postgres schema loads cleanly
* History tables cannot be updated or deleted
* Empty database supports all downstream needs

---

## 6. Phase 2 – End-to-End Thin Slice

### Objectives

* Prove system flow without intelligence

### Tasks

* Insert fake weekly input data
* Generate minimal fake features
* Produce dummy model predictions
* Run trivial agent logic (e.g., pick first game)
* Write outputs to history tables
* Generate a dummy report

### Acceptance Criteria

* One fake week flows end-to-end
* Report is generated deterministically
* No live computation during reporting

---

## 7. Phase 3 – Baseline Intelligence

### Objectives

* Replace fake logic with real but simple logic

### Tasks

* Implement real feature builders
* Add baseline models (Ridge / ElasticNet)
* Emit full predictive distributions
* Store model hashes and metrics

### Acceptance Criteria

* Models train and predict reproducibly
* Outputs are probabilistic, not point-only
* Backtests can be rerun identically

---

## 8. Phase 4 – Decision Agents (V1)

### Objectives

* Separate prediction from decision-making

### Tasks

* Implement ATS agent v1
* Implement Totals agent v1
* Implement Survivor agent v1 (limited scope)
* Add constraint handling and policy versions

### Acceptance Criteria

* Agents consume history only
* Decisions are explainable and logged
* No agent writes outside its scope

---

## 9. Phase 5 – Evaluation & Learning Loop

### Objectives

* Measure correctness and calibration

### Tasks

* Implement weekly evaluation jobs
* Compute Brier, log loss, CLV
* Store metrics in evaluation history
* Add rolling performance summaries

### Acceptance Criteria

* Performance is measurable per model and agent
* Past weeks are never mutated
* Learning decisions are auditable

---

## 10. Phase 6 – Presentation Layer

### Objectives

* Publish results safely
* Prepare for monetization

### Tasks

* Generate DOCX and HTML reports
* Build read-only website views
* Enforce reader-only DB access
* Publish historical performance

### Acceptance Criteria

* Website reads history tables only
* No recomputation from web requests
* System remains correct without website

---

## 11. Explicit Non-Goals (V2)

The following are intentionally out of scope:

* Live odds ingestion
* Automated wagering
* Real-money bankroll management
* Real-time APIs or streaming
* User accounts or personalization

Adding these requires a new build plan.

---

## 12. Risk Management

| Risk                 | Mitigation             |
| -------------------- | ---------------------- |
| Premature complexity | Enforce phase gates    |
| Data leakage         | Strict immutability    |
| Overfitting          | Simple baselines first |
| Scope creep          | Explicit non-goals     |

---

## 13. Completion Definition

SemiSharp V2 is considered **complete** when:

* A full NFL season can be run end-to-end
* Results are reproducible months later
* Picks, rationale, and performance are explainable
* The website can be rebuilt entirely from history

At that point, the system is ready for V3 extensions.

---

## 14. Summary

This build plan prioritizes:

* Correctness over cleverness
* Discipline over speed
* Long-term leverage over short-term wins

Following this plan minimizes rework and maximizes learning velocity.

