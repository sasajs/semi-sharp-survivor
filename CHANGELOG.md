# SemiSharp V2 – Development Changelog

### 2026-01-30 Start

2026-01-30 – Phase 2 Complete: Canonical Weekly Runner + Feature Snapshot Proven

What was done

Implemented canonical weekly orchestration entrypoint:

File located at ~/semisharp/scripts/run_week.py

Single supported command for running a week:

(season, week, data_version, model_hash, policy_version)

Explicit repo-root bootstrapping for reliable imports

Timezone-aware UTC timestamps only

Designed to be safe for reruns (no side effects on history tables)

Implemented weekly feature snapshot generation (Phase 2 plumbing):

File located at ~/semisharp/features/build_features_week.py

Reads versioned raw inputs from raw_games_weekly

Writes exactly one row per week to features_history

Feature data stored as a JSONB snapshot:

All games bundled under features.games

Includes n_games summary

Deterministic metadata recorded:

feature_set_version

feature_def_hash

Explicit normalization of Postgres numeric → Python float to ensure JSON safety

Append-only behavior enforced by primary key and trigger

Successfully executed weekly pipeline end-to-end for:

(season=2026, week=1, data_version='v0_fake', model_hash='mh_dummy_001', policy_version='ats_dummy_001')

Verified idempotency and invariants:

Re-running run_week.py does not create duplicate feature snapshots

features_history contains exactly one row per (season, week, data_version, model_hash)

Pipeline halts safely when data_version does not exist (no implicit fallback)

Environment & execution details

Project root is /home/steve/semisharp

All relative paths assume execution from this directory

PostgreSQL credentials are loaded via:

~/.semisharp_env

Explicitly sourced in each shell session:

source ~/.semisharp_env


Weekly pipeline executed via:

python3 scripts/run_week.py \
  --season 2026 \
  --week 1 \
  --data-version v0_fake \
  --model-hash mh_dummy_001 \
  --policy-version ats_dummy_001


### 2026-01-30 End

### 2026-01-27 – Phase 2 Complete: Trivial Agent + Permission Model Proven

**What was done**
- Implemented **trivial ATS agent (Phase 2 plumbing)**:
  - File located at `~/semisharp/agents/trivial_ats_agent.py`
  - Agent reads **only** from `model_predictions_history`
  - Agent writes **append-only** to `agent_decisions_history`
  - No game selection, no EV logic, no intelligence (metadata-only decision)
  - Idempotent via primary key `(season, week, data_version, policy_version)`
- Successfully executed agent end-to-end for:
  - `(season=2026, week=1, data_version='v0_fake')`
- Verified idempotency:
  - Re-running agent does not create duplicate rows
  - History table contains exactly one row for the policy/week

**Environment & execution details**
- Project root is **`/home/steve/semisharp`**
  - All relative paths assume execution from this directory
- PostgreSQL credentials are loaded via:
  - `~/.semisharp_env`
  - Explicitly sourced in each shell session:
    ```bash
    source ~/.semisharp_env
    ```
- `SS_PG_DSN` uses libpq keyword format:
  ```bash
  export SS_PG_DSN="dbname=semisharp_v2 user=ssadmin password=*** host=localhost"


## [Unreleased] – Phase 2: Feature + Prediction Plumbing

### Added
- Implemented **Step 3.4: Minimal feature generation**:
  - Features are generated from `raw_games_weekly`
  - Written append-only into `features_history`
  - Idempotent behavior enforced (safe to re-run)
  - Feature definitions stored as deterministic hashes
  - Existing immutability trigger (`forbid_modifications`) preserved

- Implemented **Step 4: Dummy model predictions**:
  - Deterministic, non-ML placeholder predictions
  - Written append-only into `model_predictions_history`
  - Uses existing `(season, week, data_version, model_hash)` primary key
  - Safe no-op on re-run

### Changed
- **Aligned code to existing database schema** rather than modifying schema assumptions:
  - Reused existing `features_history` table structure
  - Interpreted `model_hash` as a feature-definition hash for Step 3.4
  - Stored all feature values inside the existing `features` JSONB column
  - Avoided destructive migrations or table recreation

- **Database ownership corrections**:
  - Transferred ownership of `features_history` and `model_predictions_history` to application role (`ssadmin`)
  - Ensures future inserts and schema evolution do not require superuser access

### Security / Credentials
- **No database passwords stored in repository**
- PostgreSQL credentials are provided exclusively via environment variables:
  - `SS_PG_DSN` loaded from a local, non-versioned file (e.g. `~/.semisharp_env`)
- Passwords were:
  - Set explicitly using Postgres superuser (`ALTER USER`)
  - Verified via direct `psql` connection before use
  - Never written to source control, docs, or commit history
- This approach supports:
  - Local development
  - Cron / automation
  - Future CI runners
  without credential leakage

### Notes
- Several schema mismatches were discovered and resolved early (team IDs vs names, missing market columns, existing history tables).
- Resolving these at the plumbing stage prevented silent downstream errors in modeling and agent logic.
- From this point forward, all pipeline steps read **only from immutable history tables**.


### 2026-01-21 – Phase 2 Started (Weekly Input Spine Proven)

**What was done**
- Resumed work after Phase 1 with focus on Phase 2 (end-to-end thin slice)
- Resolved Postgres authentication, role, and schema permission issues
- Confirmed active database name is **`semisharp_v2`** (important)
- Established `ssadmin` as the non-superuser build role
- Granted explicit `CREATE` privilege on `public` schema to `ssadmin`
- Created first weekly input table: `raw_games_weekly`
- Successfully inserted first fake weekly game row:
  - `(season=2026, week=1, data_version='v0_fake')`
- Verified table visibility and ownership via `\dt`

**Key decisions / rationale**
- Chose to fix permissions properly rather than using `postgres` or weakening auth
- Accepted short-term password usage for `ssadmin` to unblock Phase 2 work
  - Not best practice, but pragmatic for a local, single-user system
  - Future improvement: move credentials to `.env` or password manager
- Confirmed weekly input tables are separate from immutable history tables
- Validated that the data contract works in practice, not just on paper

**Current concrete state**
- Database: `semisharp_v2`
- Active build role: `ssadmin`
- Weekly input table exists and is writable
- One fake game row exists and can be read downstream
- No features, models, agents, or reports yet (by design)

**Open questions / next steps**
- Phase 2, Step 3: build minimal feature generation from `raw_games_weekly`
- Decide whether to create additional weekly input tables or keep minimal for now
- Add lightweight credential handling note to README (local-only)

**Notes for future me / ChatGPT**
- Infrastructure and permissions are now correct — do not rework auth again
- If confused on resume, start by connecting to `semisharp_v2` as `ssadmin`
- Next work should be *pure logic*, not database plumbing
- This is a clean checkpoint; nothing is half-done


### 2026-01-12 – Phase 0 Complete (Foundations)

**What was done**
- Created full repository skeleton
- Wrote and finalized ARCHITECTURE.md
- Wrote and finalized DATA_CONTRACT.md
- Wrote and finalized BUILD_PLAN.md
- Added CHANGELOG.md as working memory artifact
- Initialized git repository and committed baseline

**Key decisions / rationale**
- Adopted batch-first, local-first architecture
- Enforced immutable history tables by contract
- Explicit separation of models, agents, and presentation layers
- Website treated as downstream, read-only system
- Git history starts only after architectural freeze

**Open questions / next steps**
- Implement persistence layer (`db/schema.sql`)
- Stand up local Postgres with reader/writer roles

**Notes for future me / ChatGPT**
- Phase 0 is complete and should not be revisited lightly
- Next phase is Phase 1: Persistence Layer
- No Python code exists yet by design


## Purpose

This changelog is a **working memory and handoff artifact** for the SemiSharp V2 build.

It is designed to:

* Capture what changed and *why*, not just what was done
* Allow fast context reloading when work resumes after a pause
* Serve as a chronological narrative of architectural and implementation decisions
* Complement git history with human-readable intent

This file is intentionally lightweight and informal compared to formal documentation.

---

## How to Use This File

* Append entries in chronological order (newest at top)
* Write short, high-signal notes
* Focus on **decisions, milestones, and state**, not code diffs
* Update it at the end of each work session

This file should answer:

> “What is the current state of the system, and how did we get here?”

---

## Entry Template

Copy and paste the following template for each update:

```md
### YYYY-MM-DD – Session Summary

**What was done**
- 

**Key decisions / rationale**
- 

**Open questions / next steps**
- 

**Notes for future me / ChatGPT**
- 
```

---

## Changelog Entries

### 2026-01-12 – Project Initialization

**What was done**

* Created initial repository structure (`semisharp/`)
* Defined and saved ARCHITECTURE.md
* Defined and saved DATA_CONTRACT.md
* Defined and saved BUILD_PLAN.md
* Established local Ubuntu-based development environment

**Key decisions / rationale**

* Chose batch-first, local-first architecture
* Enforced immutability and append-only history tables
* Explicit separation between models and decision agents
* Website treated as read-only presentation layer

**Open questions / next steps**

* Implement Postgres schema (`db/schema.sql`)
* Stand up local Postgres roles (reader / writer)

**Notes for future me / ChatGPT**

* We are finished with Phase 0 (Foundations)
* Next phase is Phase 1: Persistence layer
* No Python code has been written yet by design

---

## Current State Summary (Quick Prime)

* Phase: **Phase 0 complete**
* Repo structure: **created and committed**
* Contracts: **frozen (Architecture, Data Contract, Build Plan)**
* Database: **not yet implemented**
* Models / Agents: **not started**
* Website: **planned only**

When resuming work, start by reviewing:

1. `ARCHITECTURE.md`
2. `DATA_CONTRACT.md`
3. The most recent changelog entry above

---

## Rules

* This file is always safe to edit
* Nothing here overrides contracts or schema
* If this file and a contract disagree, the contract wins

---

## Summary

This changelog is the **narrative glue** of the SemiSharp V2 project.

It exists to reduce re-onboarding time, preserve intent, and keep development sessions coherent over long timelines.

