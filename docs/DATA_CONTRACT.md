# Data Contract – SemiSharp V2

## 1. Purpose

This document defines the **canonical data contract** for SemiSharp V2. It specifies:

* How data is identified by week
* The classes of tables in the system
* Immutability and versioning rules
* Prohibited operations

This contract exists to guarantee **reproducibility, auditability, and correctness** across modeling, agent decisions, reporting, and the public website.

Once data is written in accordance with this contract, it must be possible to reproduce any prior result exactly.

---

## 2. Core Principles

1. **Weeks are immutable once published**
2. **History tables are the system of truth**
3. **No downstream process may modify upstream outputs**
4. **Versioning is explicit, never implicit**
5. **Presentation layers are read-only**

---

## 3. Week Identity

A unique analytical week in SemiSharp V2 is defined by the tuple:

* `season` (INTEGER)
* `week` (INTEGER)
* `data_version` (TEXT)

### Definitions

* **season**: NFL season year (e.g., 2026)
* **week**: NFL week number (1–18, plus postseason if included)
* **data_version**: A human-readable identifier indicating the exact input snapshot

### data_version Rules

* Bumped whenever any raw weekly input changes
* Examples:

  * `v1_opening`
  * `v2_final`
  * `v1_backfill`

`season + week + data_version` uniquely identify a frozen snapshot.

---

## 4. Table Classes

All tables in SemiSharp V2 fall into **exactly one** of the following classes.

### 4.1 Reference Tables (Mutable)

**Purpose**

* Normalize identifiers
* Provide shared lookup data

**Characteristics**

* May be updated over time
* Must not contain week-specific metrics
* Must never be used directly in reports or the website

**Examples**

* `teams`
* `stadiums`
* `season_calendar`

Reference tables may change without invalidating historical results because they are not part of frozen snapshots.

---

### 4.2 Weekly Input Tables (Append-Only)

**Purpose**

* Store raw inputs for a specific week and data version

**Characteristics**

* Written once per `(season, week, data_version)`
* Never updated or deleted
* Treated as raw, pre-feature data

**Examples**

* `raw_lines_2026_wk05_v2`
* `raw_results_2026_wk05_v1`

**Rules**

* Corrections require a **new data_version**
* Old versions remain permanently available

---

### 4.3 History Tables (Immutable, Canonical)

**Purpose**

* Represent the official analytical record

**Characteristics**

* Append-only
* Never updated or deleted
* Fully sufficient for reproduction

**Examples**

* `features_history`
* `model_predictions_history`
* `agent_decisions_history`
* `evaluation_metrics_history`
* `report_artifacts`

All reports, evaluations, and website views **must read exclusively from history tables**.

---

## 5. Required Metadata Columns

Every history table row **must include** the following fields:

* `season`
* `week`
* `data_version`
* `model_hash` (nullable if not applicable)
* `policy_version` (nullable if not applicable)
* `created_at` (timestamp)

These fields ensure full lineage from raw input to final output.

---

## 6. Versioning Semantics

### 6.1 data_version

Indicates which raw inputs were used.

Bump when:

* Lines are updated
* Results are corrected
* Any raw feed changes

---

### 6.2 model_hash

A deterministic hash of:

* Model code
* Hyperparameters
* Feature list

Bump when:

* Model logic changes
* Parameters change
* Feature definitions change

---

### 6.3 policy_version

A human-readable identifier for agent logic.

Examples:

* `ats_v1_basic`
* `survivor_v2_mc`

Bump when:

* Agent constraints change
* Selection logic changes
* Risk handling changes

---

## 7. Immutability Rules (Hard Requirements)

The following operations are **strictly prohibited**:

* UPDATE on history tables
* DELETE from history tables
* Recomputing features or predictions for an existing `(season, week, data_version)`
* Modifying agent decisions after publication

If something is wrong:

* Create a new `data_version`, `model_hash`, or `policy_version`
* Write new rows
* Leave old rows untouched

---

## 8. Allowed Write Paths

| Table Class  | Write Allowed | Update Allowed | Delete Allowed |
| ------------ | ------------- | -------------- | -------------- |
| Reference    | Yes           | Yes            | Yes            |
| Weekly Input | Yes (once)    | No             | No             |
| History      | Yes (append)  | No             | No             |

---

## 9. Read Rules by System Component

### Models

* May read: reference, weekly input, history
* May write: history (predictions only)

### Agents

* May read: history
* May write: history (decisions only)

### Reports

* May read: history only
* May write: report_artifacts only

### Website

* May read: history only (read-only DB role)
* May write: nothing

---

## 10. Prohibited Operations (Explicit)

The following are never allowed:

* Live recomputation triggered by the website
* Backfilling history tables in place
* Mixing reference data into reports
* Mutating past weeks to improve metrics
* Writing picks without version identifiers

Violations of these rules invalidate all downstream analysis.

---

## 11. Enforcement Expectations

This contract is enforced by:

* Database permissions (reader vs writer roles)
* Code review discipline
* Scheduled batch jobs only

No runtime system should rely on convention alone to maintain these guarantees.

---

## 12. Summary

The SemiSharp V2 data contract ensures that:

* Every decision is reproducible
* Every mistake is visible
* Every improvement is additive, not destructive

Once adopted, this contract should change **rarely and deliberately**, as it defines the long-term integrity of the system.

