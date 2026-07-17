# SemiSharp API Catalog

Generated: 2026-07-17 16:49:30.254377

Total API Routes: 41

---

## GET /

**Summary:** Read Root

**Operation ID:** `read_root__get`

### Responses

- `200` Successful Response

---

## POST /admin/jobs

**Tags:** Administration

**Summary:** Create Admin Job

**Operation ID:** `create_admin_job_admin_jobs_post`

### Request Body

- application/json

### Responses

- `202` Successful Response
- `422` Validation Error

---

## GET /admin/jobs

**Tags:** Administration

**Summary:** Admin Job History

**Operation ID:** `admin_job_history_admin_jobs_get`

### Parameters

- `limit` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /admin/jobs/types

**Tags:** Administration

**Summary:** Allowed Job Types

**Operation ID:** `allowed_job_types_admin_jobs_types_get`

### Responses

- `200` Successful Response

---

## GET /admin/jobs/{job_id}

**Tags:** Administration

**Summary:** Admin Job Detail

**Operation ID:** `admin_job_detail_admin_jobs__job_id__get`

### Parameters

- `job_id` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## POST /auth/login

**Tags:** Authentication

**Summary:** Login

**Operation ID:** `login_auth_login_post`

### Request Body

- application/json

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /context/current

**Tags:** Context

**Summary:** Current Context

**Operation ID:** `current_context_context_current_get`

### Responses

- `200` Successful Response

---

## PUT /context/current

**Tags:** Context

**Summary:** Update Context

**Operation ID:** `update_context_context_current_put`

### Request Body

- application/json

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /health

**Summary:** Health Check

**Operation ID:** `health_check_health_get`

### Responses

- `200` Successful Response

---

## GET /injuries/sic/{season}/{week}

**Tags:** Injuries

**Summary:** Get Sic Scores

**Operation ID:** `get_sic_scores_injuries_sic__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /market/consensus/{season}/{week}

**Tags:** Market

**Summary:** Get Consensus

**Operation ID:** `get_consensus_market_consensus__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /market/projection-edge/{season}/{week}

**Tags:** Market

**Summary:** Get Projection Edge

**Operation ID:** `get_projection_edge_market_projection_edge__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /projections/{season}/{week}

**Tags:** Projections

**Summary:** Get Projections

**Operation ID:** `get_projections_projections__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /ratings/pff/{season}/{week}

**Tags:** Ratings

**Summary:** Pff Power Rankings

**Operation ID:** `pff_power_rankings_ratings_pff__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /reference/home-field-advantage/{season}

**Tags:** Reference Data

**Summary:** Home Field Advantage

**Operation ID:** `home_field_advantage_reference_home_field_advantage__season__get`

### Parameters

- `season` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## PATCH /reference/home-field-advantage/{season}/{team_id}

**Tags:** Reference Data

**Summary:** Patch Home Field Advantage

**Operation ID:** `patch_home_field_advantage_reference_home_field_advantage__season___team_id__patch`

### Parameters

- `season` (path)
- `team_id` (path)

### Request Body

- application/json

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /risk/game/{game_id}

**Tags:** Risk

**Summary:** Get Game Risk

**Operation ID:** `get_game_risk_risk_game__game_id__get`

### Parameters

- `game_id` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /risk/methodology

**Tags:** Risk

**Summary:** Get Methodology

**Operation ID:** `get_methodology_risk_methodology_get`

### Responses

- `200` Successful Response

---

## GET /risk/week/{season}/{week}

**Tags:** Risk

**Summary:** Get Risks

**Operation ID:** `get_risks_risk_week__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /risk/{season}/{week}

**Tags:** Risk

**Summary:** Get Risks

**Operation ID:** `get_risks_risk__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /schedule/{season}/{week}

**Tags:** Schedule

**Summary:** Get Schedule

**Operation ID:** `get_schedule_schedule__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## PUT /season-management/current-week

**Tags:** Season Management

**Summary:** Update Current Week

**Operation ID:** `update_current_week_season_management_current_week_put`

### Request Body

- application/json

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /season-management/entries/{entry_id}/picks

**Tags:** Season Management

**Summary:** Entry Picks

**Operation ID:** `entry_picks_season_management_entries__entry_id__picks_get`

### Parameters

- `entry_id` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## POST /season-management/entries/{entry_id}/picks

**Tags:** Season Management

**Summary:** Create Pick

**Operation ID:** `create_pick_season_management_entries__entry_id__picks_post`

### Parameters

- `entry_id` (path)

### Request Body

- application/json

### Responses

- `201` Successful Response
- `422` Validation Error

---

## PUT /season-management/entries/{entry_id}/picks/{contest_leg_id}

**Tags:** Season Management

**Summary:** Correct Pick

**Operation ID:** `correct_pick_season_management_entries__entry_id__picks__contest_leg_id__put`

### Parameters

- `entry_id` (path)
- `contest_leg_id` (path)

### Request Body

- application/json

### Responses

- `200` Successful Response
- `422` Validation Error

---

## DELETE /season-management/entries/{entry_id}/picks/{contest_leg_id}

**Tags:** Season Management

**Summary:** Remove Pick

**Operation ID:** `remove_pick_season_management_entries__entry_id__picks__contest_leg_id__delete`

### Parameters

- `entry_id` (path)
- `contest_leg_id` (path)

### Request Body

- application/json

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /season-management/entries/{entry_id}/valid-picks/{contest_leg_id}

**Tags:** Season Management

**Summary:** Valid Pick Options

**Operation ID:** `valid_pick_options_season_management_entries__entry_id__valid_picks__contest_leg_id__get`

### Parameters

- `entry_id` (path)
- `contest_leg_id` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /season-management/status

**Tags:** Season Management

**Summary:** Season Management Status

**Operation ID:** `season_management_status_season_management_status_get`

### Responses

- `200` Successful Response

---

## GET /strategies

**Tags:** Strategies

**Summary:** Get Strategies

**Operation ID:** `get_strategies_strategies_get`

### Responses

- `200` Successful Response

---

## GET /strategies/bottom-six-road-fade/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Bottom Six Road Fade

**Operation ID:** `bottom_six_road_fade_strategies_bottom_six_road_fade__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/circa-holiday/{season}

**Tags:** Strategies

**Summary:** Circa Holiday

**Operation ID:** `circa_holiday_strategies_circa_holiday__season__get`

### Parameters

- `season` (path)
- `rating_week` (query)
- `hfa_source` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/compare/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Compare Strategy Paths

**Operation ID:** `compare_strategy_paths_strategies_compare__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)
- `entry_id` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/current-week-highest-win/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Current Week Highest Win

**Operation ID:** `current_week_highest_win_strategies_current_week_highest_win__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)
- `entry_id` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/dynamic-programming/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Dynamic Programming

**Operation ID:** `dynamic_programming_strategies_dynamic_programming__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)
- `entry_id` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/future-value/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Future Value

**Operation ID:** `future_value_strategies_future_value__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)
- `entry_id` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/market-arbitrage-exit/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Market Arbitrage Exit

**Operation ID:** `market_arbitrage_exit_strategies_market_arbitrage_exit__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/monte-carlo/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Monte Carlo

**Operation ID:** `monte_carlo_strategies_monte_carlo__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)
- `entry_id` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/multiple-entry/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Multiple Entry

**Operation ID:** `multiple_entry_strategies_multiple_entry__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)
- `user_id` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategies/projection-edge/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Projection Edge

**Operation ID:** `projection_edge_strategies_projection_edge__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /strategy-context/{entry_id}

**Tags:** Strategy Context

**Summary:** Get Strategy Context

**Operation ID:** `get_strategy_context_strategy_context__entry_id__get`

### Parameters

- `entry_id` (path)
- `contest_format` (query)
- `contest_leg_id` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /team-aliases

**Tags:** Team Aliases

**Summary:** Get Team Aliases

**Operation ID:** `get_team_aliases_team_aliases_get`

### Parameters

- `team_id` (query)
- `source_system` (query)
- `active_only` (query)
- `search` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## POST /team-aliases

**Tags:** Team Aliases

**Summary:** Create Team Alias

**Operation ID:** `create_team_alias_team_aliases_post`

### Request Body

- application/json

### Responses

- `201` Successful Response
- `422` Validation Error

---

## GET /team-aliases/resolve

**Tags:** Team Aliases

**Summary:** Resolve Team Alias

**Operation ID:** `resolve_team_alias_team_aliases_resolve_get`

### Parameters

- `alias_value` (query)
- `source_system` (query)

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /team-aliases/sources

**Tags:** Team Aliases

**Summary:** Get Team Alias Sources

**Operation ID:** `get_team_alias_sources_team_aliases_sources_get`

### Responses

- `200` Successful Response

---

## PATCH /team-aliases/{alias_id}/status

**Tags:** Team Aliases

**Summary:** Update Team Alias Status

**Operation ID:** `update_team_alias_status_team_aliases__alias_id__status_patch`

### Parameters

- `alias_id` (path)

### Request Body

- application/json

### Responses

- `200` Successful Response
- `422` Validation Error

---

## GET /teams

**Tags:** Teams

**Summary:** Get Teams

**Operation ID:** `get_teams_teams_get`

### Responses

- `200` Successful Response

---

