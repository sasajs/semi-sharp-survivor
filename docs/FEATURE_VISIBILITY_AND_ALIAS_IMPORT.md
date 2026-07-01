# Semi-Sharp V2 Feature Visibility and Reference Data Operations

This document outlines the usage, configuration, and architectural design of the newly integrated **Data Operations features** and **Feature Visibility controllers** in Semi-Sharp V2.

---

## 1. Team Alias Reference CSV Import

Team aliases allow the NFL Schedule Import pipeline to translate raw team names/synonyms from external sources (such as ESPN, Circa sheets, or third-party JSON API feeds) into canonical team IDs inside our database.

### Reference Dataset
- **File Path**: `data/reference/team_aliases.csv`
- **Columns**: `team_id`, `alias`, `normalized_alias`, `provider_name`, `alias_type`, `priority`, `active`, `notes`

### Administrative Workflow (CSV Import)
To refresh or seed the aliases database table:
1. Navigate to **Admin Dashboard** → **Reference Data Registry** → **Team Synonym Aliases**.
2. Click **Load Reference CSV** to read and extract records from `data/reference/team_aliases.csv`.
3. Click **Preview Alias Import** to inspect validation warnings (e.g. valid `team_id` references, duplicate rules, and priority constraints).
4. Click **Import / Refresh Alias Table** to execute an atomic SQL `ON CONFLICT (normalized_alias, provider_name) DO UPDATE` upsert, safely writing aliases without duplicate collisions.

---

## 2. Refined Schedule Import Pipeline

We have established a structured, 4-step pipeline workflow at the top of the **NFL Weekly Schedule** Import page to prevent premature ingestion of unvalidated datasets.

### Structured Pipeline Steps
1. **Step 1: Load / Upload CSV**
   - Click **Load Sample Schedule** to place raw baseline reference schedule CSVs into the pending directories (`imports/schedule/pending/`).
2. **Step 2: Preview Schedule**
   - Click **Preview Schedule** to view a detailed table of raw games, detected weeks, home/away names, and general metadata from the pending file.
3. **Step 3: Validate Schedule**
   - Click **Validate Schedule** to invoke the team synonym alias resolution engine. It verifies if every team name in the file correctly maps to a canonical database team ID, flagging unresolved warnings.
4. **Step 4: Update Schedule**
   - Once validated, the **Update Schedule** action becomes active. Clicking it writes all valid games into the database and archives the ingested file.

---

## 3. Central Feature Visibility & Navigation Framework

To support gradual feature launches and avoid cluttering the production interface, a modular feature visibility and navigation partitioning system is configured.

### Navigation Partitioning
The left sidebar navigation is divided into four distinct sections to separate stable, fully-functional features from planned/future ones:
1. **User Dashboard**: Currently working, stable user-facing features (Overview, Picks Matrix, Portfolio Entries, available teams, reports, rules, audits).
2. **User Dashboard — Future Releases**: Mathematical forecast models, optimizer algorithms, consensus systems, and learning loops scheduled for subsequent updates.
3. **Admin Dashboard**: Active operational databases, schedules, and synonyms controllers.
4. **Admin Dashboard — Future Releases**: In-development diagnostics and secondary integrations (Venues, Injury, Weather, and Odds).

### Configuration Registry
- **File Path**: `/src/config/featureVisibility.ts`
- **Central Control Flag**: `SHOW_FUTURE_RELEASES = true` (Set to `false` to completely hide all Future Release sections later).
- **Status Types**:
  - `"working"`: Stable features rendered in Working sections of the navigation.
  - `"future_release"`: Incomplete or diagnostic features rendered in Future Releases sections.
  - `"experimental"`: Dev/diagnostic views hidden by default.
  - `"hidden"`: Features permanently suppressed from the UI.

---

## 4. Navigation Maintenance Guide

### How to Move a Page from Future Release to Working
1. Open `/src/config/featureVisibility.ts`.
2. Locate the feature key you wish to promote (e.g. `"contest-ev"`).
3. Change its `section` property from `"user_future"` to `"user_working"`.
4. Change its `status` property from `"future_release"` to `"working"`.
5. Update its `badge` property to `"Working"` or remove it.
6. Save the file. The sidebar navigation will update instantly.

### How to Hide Future Release Sections Completely
To clean up the sidebar and hide all future release sections in a future production release:
1. Open `/src/config/featureVisibility.ts`.
2. Set the global export constant:
   ```typescript
   export const SHOW_FUTURE_RELEASES = false;
   ```
3. Save the file. This will hide the entire **User Dashboard — Future Releases** and **Admin Dashboard — Future Releases** blocks from the left sidebar navigation while keeping your configuration schema intact.

### Functional Integrity
**No functionality or route was deleted.** All existing diagnostic pages, forecast views, and orchestration setups are still 100% accessible and correctly wired. Grouping them into Future Release sections simply cleans up the primary workspace for a cleaner operator experience.
