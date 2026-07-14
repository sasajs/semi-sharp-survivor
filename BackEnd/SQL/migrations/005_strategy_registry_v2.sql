BEGIN;

-- ------------------------------------------------------------
-- Active V2 strategies
-- ------------------------------------------------------------

UPDATE strategy.registry
SET
    display_name = 'Current Week Highest Win',
    description = 'Ranks all eligible teams for the active contest leg using canonical risk-adjusted win probability.',
    endpoint = '/strategies/current-week-highest-win',
    runtime_class = 'FAST',
    requires_background_job = FALSE,
    parameters = '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source",
        "entry_id"
    ]'::jsonb,
    is_active = TRUE,
    updated_at = now()
WHERE strategy_code = 'CURRENT_WEEK_HIGHEST_WIN';


UPDATE strategy.registry
SET
    display_name = 'Future Value',
    description = 'Builds a complete remaining-season path balancing immediate survival against future opportunity cost while enforcing CIRCA holiday feasibility.',
    endpoint = '/strategies/future-value',
    runtime_class = 'FAST',
    requires_background_job = FALSE,
    parameters = '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source",
        "entry_id"
    ]'::jsonb,
    is_active = TRUE,
    updated_at = now()
WHERE strategy_code = 'FUTURE_VALUE';


UPDATE strategy.registry
SET
    display_name = 'Bottom Six Road Fade',
    description = 'Builds a season path preferring home teams facing bottom-six opponents on the road, with probability-based fallback selections.',
    endpoint = '/strategies/bottom-six-road-fade',
    runtime_class = 'FAST',
    requires_background_job = FALSE,
    parameters = '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source"
    ]'::jsonb,
    is_active = TRUE,
    updated_at = now()
WHERE strategy_code = 'BOTTOM_SIX_ROAD_FADE';


UPDATE strategy.registry
SET
    display_name = 'Market Arbitrage Exit (Week 10)',
    description = 'Maximizes survivor probability through NFL Week 10 without preserving teams for later weeks.',
    endpoint = '/strategies/market-arbitrage-exit',
    runtime_class = 'FAST',
    requires_background_job = FALSE,
    parameters = '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source"
    ]'::jsonb,
    is_active = TRUE,
    updated_at = now()
WHERE strategy_code = 'MARKET_ARBITRAGE_EXIT';


UPDATE strategy.registry
SET
    display_name = 'Monte Carlo Survivor',
    description = 'Generates legal survivor paths and evaluates them through repeated outcome simulations with probability uncertainty.',
    endpoint = '/strategies/monte-carlo',
    runtime_class = 'HEAVY',
    requires_background_job = TRUE,
    parameters = '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source"
    ]'::jsonb,
    is_active = TRUE,
    updated_at = now()
WHERE strategy_code = 'MONTE_CARLO';


UPDATE strategy.registry
SET
    display_name = 'Dynamic Programming Optimizer',
    description = 'Reference season optimizer using beam-search dynamic programming to maximize summed log risk-adjusted win probability.',
    endpoint = '/strategies/dynamic-programming',
    runtime_class = 'HEAVY',
    requires_background_job = TRUE,
    parameters = '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source"
    ]'::jsonb,
    is_active = TRUE,
    updated_at = now()
WHERE strategy_code = 'DYNAMIC_PROGRAMMING';


-- ------------------------------------------------------------
-- Retired or deferred strategies
-- ------------------------------------------------------------

UPDATE strategy.registry
SET
    description = 'Retired legacy duplicate. Current Week Highest Win V2 replaces this strategy.',
    is_active = FALSE,
    updated_at = now()
WHERE strategy_code = 'HIGHEST_WIN';


UPDATE strategy.registry
SET
    description = 'Retired as a standalone survivor strategy. Projection edge remains available as an analytical feature.',
    is_active = FALSE,
    updated_at = now()
WHERE strategy_code = 'PROJECTION_EDGE';


UPDATE strategy.registry
SET
    description = 'Deferred from the V2 strategy phase. Multi-entry portfolio optimization requires correlation and ownership modeling.',
    is_active = FALSE,
    updated_at = now()
WHERE strategy_code = 'MULTIPLE_ENTRY';


UPDATE strategy.registry
SET
    description = 'Retired as a standalone strategy. Thanksgiving and Christmas feasibility are now enforced inside every season-planning strategy.',
    is_active = FALSE,
    updated_at = now()
WHERE strategy_code = 'CIRCA_HOLIDAY';


-- ------------------------------------------------------------
-- Stage Compare Strategies
--
-- It remains inactive until its API endpoint is implemented and tested.
-- This prevents the registry from advertising a route that does not yet
-- exist.
-- ------------------------------------------------------------

INSERT INTO strategy.registry (
    strategy_code,
    display_name,
    description,
    endpoint,
    runtime_class,
    requires_background_job,
    parameters,
    is_active
)
VALUES (
    'COMPARE_STRATEGIES',
    'Compare Strategies',
    'Runs the production season-planning strategies for one entry and returns a unified leg-by-leg comparison with survival probabilities and agreement metrics.',
    '/strategies/compare',
    'HEAVY',
    TRUE,
    '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source",
        "entry_id"
    ]'::jsonb,
    FALSE
)
ON CONFLICT (strategy_code)
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    endpoint = EXCLUDED.endpoint,
    runtime_class = EXCLUDED.runtime_class,
    requires_background_job =
        EXCLUDED.requires_background_job,
    parameters = EXCLUDED.parameters,
    is_active = FALSE,
    updated_at = now();

COMMIT;
