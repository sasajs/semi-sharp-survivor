# SemiSharp API Catalog

Generated: 2026-07-10 13:21:20.445949

Total API Routes: 23

---

## POST /auth/login

**Tags:** Authentication

**Summary:** Login

**Operation ID:** `login_auth_login_post`

### Parameters

- `username` (query)
- `password` (query)

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

## GET /strategies

**Tags:** Strategy Registry

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

## GET /strategies/current-week-highest-win/{season}/{contest_format}

**Tags:** Strategies

**Summary:** Current Week Highest Win

**Operation ID:** `current_week_highest_win_strategies_current_week_highest_win__season___contest_format__get`

### Parameters

- `season` (path)
- `contest_format` (path)
- `rating_week` (query)
- `hfa_source` (query)

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

## GET /teams

**Tags:** Teams

**Summary:** Get Teams

**Operation ID:** `get_teams_teams_get`

### Responses

- `200` Successful Response

---

