BEGIN;

UPDATE strategy.registry
SET
    display_name = 'Compare Strategies',
    description = 'Runs Future Value, Bottom Six Road Fade, Market Arbitrage Exit, Monte Carlo, and Dynamic Programming for one entry and returns a unified leg-by-leg comparison with horizon-aware probability rankings.',
    endpoint = '/strategies/compare',
    runtime_class = 'HEAVY',
    requires_background_job = TRUE,
    parameters = '[
        "season",
        "contest_format",
        "rating_week",
        "hfa_source",
        "entry_id"
    ]'::jsonb,
    is_active = TRUE,
    updated_at = now()
WHERE strategy_code = 'COMPARE_STRATEGIES';

COMMIT;
