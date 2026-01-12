# Architecture – SemiSharp V2

## 1. Purpose

This document defines the **system architecture for SemiSharp V2**, a probabilistic, agent-driven NFL betting research platform.

It describes:

* System components and boundaries
* Data and control flow
* Responsibilities of each layer
* Design decisions and trade-offs

This is an **architecture specification**, not an implementation guide.

---

## 2. Architectural Goals

SemiSharp V2 is designed to:

1. Produce **probabilistic predictions**, not picks
2. Separate **prediction** from **decision-making**
3. Guarantee **reproducibility and auditability**
4. Run **batch-first** on a single local server
5. Support **read-only publishing and monetization** without influencing decisions

Non-goals are explicitly documented to prevent scope creep.

---

## 3. High-Level System View

SemiSharp V2 is composed of five major layers:

1. Data Ingestion & Normalization
2. Feature Store
3. Modeling Layer
4. Decision Agents
5. History, Reporting, and Website

Each layer communicates only through persisted tables and explicit schemas.

---

## 4. Data Ingestion & Normalization Layer

### Responsibilities

* Ingest external inputs (schedules, lines, results, placeholders)
* Normalize identifiers and formats
* Validate schemas

### Characteristics

* Batch-oriented
* Idempotent
* Append-only for weekly inputs

### Outputs

* Weekly input tables keyed by `(season, week, data_version)`

This layer performs **no feature engineering and no modeling**.

---

## 5. Feature Store Layer

### Philosophy

* No external feature store technology
* Features are materialized tables in Postgres
* All features are cheap to compute and explain

### Feature Types

* Team strength (rolling margins, efficiency proxies)
* Game context (rest, travel, surface)
* Market context (open/close deltas, consensus)
* Environmental context (roof, weather buckets)
* Availability proxies (games missed, snap trends)

### Characteristics

* Recomputed on a schedule
* Written to immutable history tables
* Never recomputed on demand

---

## 6. Modeling Layer

### Responsibilities

* Consume features
* Produce probabilistic outcome distributions
* Evaluate and calibrate predictions

### Model Scope

Separate model families exist for:

* Point spread
* Game totals

### Model Types (V2 Defaults)

* Regularized linear models (Ridge, ElasticNet)
* Gradient-boosted trees (LightGBM)
* Quantile regression models

Deep learning models are explicitly out of scope for V2.

### Outputs

Each model must emit:

* Mean prediction
* Dispersion (std dev or quantiles)
* Serializable distribution metadata

Model outputs are written to history tables and never mutated.

---

## 7. Decision Agent Layer

### Core Principle

**Models predict. Agents decide.**

Agents are responsible for translating predictive distributions into contest-aware actions.

### Agent Characteristics

* Stateless per run
* Deterministic given inputs
* Governed by explicit policy versions

### Planned Agents

#### ATS Agent

* Selects against-the-spread picks
* Optimizes expected value under constraints

#### Totals Agent

* Selects over/under picks
* Handles pace and weather uncertainty explicitly

#### Survivor Agent

* Performs multi-week planning
* Uses Monte Carlo simulation and value approximation
* Optimizes survival probability, not weekly strength

Agents read from history tables and write decisions back to history.

---

## 8. History Layer (System of Record)

### Purpose

The history layer represents the **canonical analytical record**.

### Characteristics

* Append-only
* Immutable
* Fully sufficient for reproduction

### Key Tables

* `features_history`
* `model_predictions_history`
* `agent_decisions_history`
* `evaluation_metrics_history`
* `report_artifacts`

All downstream systems must read exclusively from these tables.

---

## 9. Reporting Architecture

### Design Rules

* Reports are deterministic
* Reports never trigger recomputation
* Reports read only from history tables

### Outputs

* Weekly DOCX reports
* Secondary HTML artifacts

Each report includes:

* Feature snapshots
* Model distributions
* Agent decisions and rationale
* Confidence and downside metrics

---

## 10. Website Architecture (Planned)

### Role of the Website

The website is a **presentation-only layer**.

It:

* Displays results and historical performance
* Supports future monetization
* Never influences models or agents

### Characteristics

* Read-only access
* Cached or static content
* Separate DB role with no write permissions

### Data Flow

```
history tables → website views → public site
```

---

## 11. Orchestration Model

### Execution Style

* Scheduled batch jobs
* No long-running services beyond Postgres

### Typical Weekly Flow

1. Ingest weekly inputs
2. Build features
3. Train or refresh models (optional)
4. Generate predictions
5. Run decision agents
6. Publish reports and website artifacts

Scheduling is handled via cron or CI runners.

---

## 12. Cost & Complexity Profile

### Infrastructure Assumptions

* Single Ubuntu server
* Local Postgres
* Local disk storage

### Cost Characteristics

* Feature and model compute: seconds to minutes per week
* Agent compute: milliseconds to seconds per week
* Storage growth: < 100 MB per season

Incremental monetary cost is effectively **$0/month**.

---

## 13. Explicit Non-Goals (V2)

The following are intentionally out of scope:

* Live odds ingestion
* Automated wagering
* Real-money bankroll management
* Real-time APIs or streaming
* User accounts or personalization

These require a future architectural revision.

---

## 14. Architectural Invariants

The following must remain true across all implementations:

* History tables are immutable
* Agents never retrain models
* Presentation layers are read-only
* Past weeks are never modified

Violating these invariants invalidates results.

---

## 15. Summary

SemiSharp V2 is architected to:

* Make intelligence cheap
* Make decisions explainable
* Make mistakes visible

The system prioritizes clarity, reproducibility, and long-term leverage over short-term sophistication.

