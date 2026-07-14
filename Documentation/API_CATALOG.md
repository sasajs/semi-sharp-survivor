# SemiSharp API Catalog

Generated: 2026-07-14 15:55:49.131474

Total API Routes: 32

---

## GET /

**Summary:** Read Root

**Operation ID:** `read_root__get`

### Responses

- `200` Successful Response

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

## GET /risk/probabilities/{season}/{week}

**Tags:** Risk

**Summary:** Get Probabilities

**Operation ID:** `get_probabilities_risk_probabilities__season___week__get`

### Parameters

- `season` (path)
- `week` (path)

### Responses

- `200` Successful Response
- `422` Validation Error

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

## GET /teams

**Tags:** Teams

**Summary:** Get Teams

**Operation ID:** `get_teams_teams_get`

### Responses

- `200` Successful Response

---

