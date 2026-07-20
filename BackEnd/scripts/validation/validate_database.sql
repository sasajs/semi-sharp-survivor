\set ON_ERROR_STOP on

\echo '============================================================'
\echo 'SEMISHARP DATABASE VALIDATION'
\echo '============================================================'

\echo ''
\echo '===== 1. REQUIRED OBJECTS ====='

WITH required_objects(schema_name, object_name, object_type) AS (
    VALUES
        ('schedule', 'games', 'BASE TABLE'),
        ('ratings', 'pff_power_ratings', 'BASE TABLE'),
        ('reference', 'teams', 'BASE TABLE'),
        ('reference', 'home_field_advantage', 'BASE TABLE'),
        ('projections', 'game_spreads', 'BASE TABLE'),
        ('market', 'bookmakers', 'BASE TABLE'),
        ('market', 'events', 'BASE TABLE'),
        ('market', 'spreads', 'BASE TABLE'),
        ('market', 'consensus_spreads', 'VIEW'),
        ('market', 'projection_edges', 'VIEW'),
        ('risk', 'game_risk_scores', 'BASE TABLE')
)
SELECT
    r.schema_name,
    r.object_name,
    r.object_type AS expected_type,
    CASE
        WHEN t.table_name IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END AS status
FROM required_objects r
LEFT JOIN information_schema.tables t
  ON t.table_schema = r.schema_name
 AND t.table_name = r.object_name
ORDER BY r.schema_name, r.object_name;

\echo ''
\echo '===== 2. WEEKLY SCHEDULE COUNTS ====='

SELECT
    season,
    week,
    COUNT(*) AS game_count,
    COUNT(DISTINCT game_id) AS distinct_game_count,
    CASE
        WHEN COUNT(*) = COUNT(DISTINCT game_id) THEN 'PASS'
        ELSE 'FAIL'
    END AS unique_game_id_status
FROM schedule.games
GROUP BY season, week
ORDER BY season DESC, week;

\echo ''
\echo '===== 3. DUPLICATE SCHEDULE GAME IDS ====='

SELECT
    game_id,
    COUNT(*) AS row_count
FROM schedule.games
GROUP BY game_id
HAVING COUNT(*) > 1
ORDER BY row_count DESC, game_id;

\echo ''
\echo '===== 4. INVALID TEAM REFERENCES ====='

SELECT
    g.game_id,
    g.away_team_id,
    g.home_team_id,
    away.team_id AS matched_away_team_id,
    home.team_id AS matched_home_team_id
FROM schedule.games g
LEFT JOIN reference.teams away
  ON away.team_id = g.away_team_id
LEFT JOIN reference.teams home
  ON home.team_id = g.home_team_id
WHERE away.team_id IS NULL
   OR home.team_id IS NULL
ORDER BY g.season, g.week, g.game_id;

\echo ''
\echo '===== 5. PROJECTION COVERAGE ====='

SELECT
    g.season,
    g.week,
    COUNT(*) AS scheduled_games,
    COUNT(p.game_id) AS projected_games,
    COUNT(*) - COUNT(p.game_id) AS missing_projections,
    ROUND(
        100.0 * COUNT(p.game_id) / NULLIF(COUNT(*), 0),
        2
    ) AS projection_coverage_pct
FROM schedule.games g
LEFT JOIN projections.game_spreads p
  ON p.game_id = g.game_id
 AND p.season = g.season
 AND p.week = g.week
GROUP BY g.season, g.week
ORDER BY g.season DESC, g.week;

\echo ''
\echo '===== 6. DUPLICATE ACTIVE PROJECTIONS ====='

SELECT
    season,
    week,
    game_id,
    COUNT(*) AS row_count
FROM projections.game_spreads
GROUP BY season, week, game_id
HAVING COUNT(*) > 1
ORDER BY season DESC, week, game_id;

\echo ''
\echo '===== 7. MARKET EVENT SCHEDULE ALIGNMENT ====='

SELECT
    g.season AS schedule_season,
    g.week AS schedule_week,
    g.game_id,
    e.season AS market_season,
    e.week AS market_week,
    CASE
        WHEN e.market_event_id IS NULL THEN 'MISSING_EVENT'
        WHEN e.season <> g.season OR e.week <> g.week THEN 'WEEK_MISMATCH'
        ELSE 'PASS'
    END AS status
FROM schedule.games g
LEFT JOIN market.events e
  ON e.game_id = g.game_id
WHERE e.market_event_id IS NULL
   OR e.season <> g.season
   OR e.week <> g.week
ORDER BY g.season, g.week, g.game_id;

\echo ''
\echo '===== 8. DUPLICATE MARKET EVENTS BY GAME ====='

SELECT
    game_id,
    COUNT(*) AS event_count,
    STRING_AGG(
        market_event_id::text,
        ', ' ORDER BY market_event_id
    ) AS market_event_ids
FROM market.events
WHERE game_id IS NOT NULL
GROUP BY game_id
HAVING COUNT(*) > 1
ORDER BY event_count DESC, game_id;

\echo ''
\echo '===== 9. LATEST MARKET PAIR COMPLETENESS ====='

WITH latest_lines AS (
    SELECT DISTINCT ON (
        e.game_id,
        s.bookmaker_key,
        s.team_id
    )
        e.game_id,
        e.home_team_id,
        e.away_team_id,
        s.bookmaker_key,
        s.team_id,
        s.pulled_at,
        s.market_spread_id
    FROM market.events e
    JOIN market.spreads s
      ON s.market_event_id = e.market_event_id
    ORDER BY
        e.game_id,
        s.bookmaker_key,
        s.team_id,
        s.pulled_at DESC,
        s.market_spread_id DESC
),
book_pairs AS (
    SELECT
        game_id,
        bookmaker_key,
        COUNT(*) FILTER (
            WHERE team_id = away_team_id
        ) AS away_rows,
        COUNT(*) FILTER (
            WHERE team_id = home_team_id
        ) AS home_rows
    FROM latest_lines
    GROUP BY game_id, bookmaker_key
)
SELECT
    game_id,
    bookmaker_key,
    away_rows,
    home_rows,
    CASE
        WHEN away_rows = 1 AND home_rows = 1 THEN 'PASS'
        ELSE 'FAIL'
    END AS status
FROM book_pairs
WHERE away_rows <> 1
   OR home_rows <> 1
ORDER BY game_id, bookmaker_key;

\echo ''
\echo '===== 10. SPREAD SIGN CONSISTENCY ====='

WITH latest_lines AS (
    SELECT DISTINCT ON (
        e.game_id,
        s.bookmaker_key,
        s.team_id
    )
        e.game_id,
        e.home_team_id,
        e.away_team_id,
        s.bookmaker_key,
        s.team_id,
        s.spread_points,
        s.pulled_at,
        s.market_spread_id
    FROM market.events e
    JOIN market.spreads s
      ON s.market_event_id = e.market_event_id
    ORDER BY
        e.game_id,
        s.bookmaker_key,
        s.team_id,
        s.pulled_at DESC,
        s.market_spread_id DESC
),
paired AS (
    SELECT
        game_id,
        bookmaker_key,
        MAX(spread_points) FILTER (
            WHERE team_id = away_team_id
        ) AS away_spread,
        MAX(spread_points) FILTER (
            WHERE team_id = home_team_id
        ) AS home_spread
    FROM latest_lines
    GROUP BY game_id, bookmaker_key
)
SELECT
    game_id,
    bookmaker_key,
    away_spread,
    home_spread,
    away_spread + home_spread AS spread_sum
FROM paired
WHERE away_spread IS NOT NULL
  AND home_spread IS NOT NULL
  AND ABS(away_spread + home_spread) > 0.001
ORDER BY game_id, bookmaker_key;

\echo ''
\echo '===== 11. CONSENSUS COVERAGE ====='

SELECT
    g.season,
    g.week,
    COUNT(*) AS scheduled_games,
    COUNT(*) FILTER (
        WHERE away_consensus.game_id IS NOT NULL
          AND home_consensus.game_id IS NOT NULL
    ) AS games_with_two_sided_consensus,
    COUNT(*) FILTER (
        WHERE away_consensus.game_id IS NULL
           OR home_consensus.game_id IS NULL
    ) AS games_missing_consensus
FROM schedule.games g
LEFT JOIN market.consensus_spreads away_consensus
  ON away_consensus.game_id = g.game_id
 AND away_consensus.team_id = g.away_team_id
LEFT JOIN market.consensus_spreads home_consensus
  ON home_consensus.game_id = g.game_id
 AND home_consensus.team_id = g.home_team_id
GROUP BY g.season, g.week
ORDER BY g.season DESC, g.week;

\echo ''
\echo '===== 12. CONSENSUS SIGN CONSISTENCY ====='

SELECT
    away.game_id,
    away.team_abbr AS away_team,
    away.consensus_spread AS away_spread,
    home.team_abbr AS home_team,
    home.consensus_spread AS home_spread,
    away.consensus_spread + home.consensus_spread AS spread_sum
FROM schedule.games g
JOIN market.consensus_spreads away
  ON away.game_id = g.game_id
 AND away.team_id = g.away_team_id
JOIN market.consensus_spreads home
  ON home.game_id = g.game_id
 AND home.team_id = g.home_team_id
WHERE ABS(
    away.consensus_spread + home.consensus_spread
) > 0.001
ORDER BY away.game_id;

\echo ''
\echo '===== 13. PROJECTION EDGE COVERAGE ====='

SELECT
    g.season,
    g.week,
    COUNT(*) AS scheduled_games,
    COUNT(*) FILTER (
        WHERE away_edge.game_id IS NOT NULL
          AND home_edge.game_id IS NOT NULL
    ) AS games_with_two_sided_edges,
    COUNT(*) FILTER (
        WHERE away_edge.game_id IS NULL
           OR home_edge.game_id IS NULL
    ) AS games_missing_edges
FROM schedule.games g
LEFT JOIN market.projection_edges away_edge
  ON away_edge.game_id = g.game_id
 AND away_edge.team_id = g.away_team_id
LEFT JOIN market.projection_edges home_edge
  ON home_edge.game_id = g.game_id
 AND home_edge.team_id = g.home_team_id
GROUP BY g.season, g.week
ORDER BY g.season DESC, g.week;

\echo ''
\echo '===== 14. RISK COVERAGE ====='

SELECT
    g.season,
    g.week,
    COUNT(*) AS scheduled_games,
    COUNT(DISTINCT r.game_id) AS games_with_any_risk,
    COUNT(DISTINCT (r.game_id, r.team_id)) AS team_risk_records
FROM schedule.games g
LEFT JOIN risk.game_risk_scores r
  ON r.game_id = g.game_id
 AND r.season = g.season
 AND r.week = g.week
GROUP BY g.season, g.week
ORDER BY g.season DESC, g.week;

\echo ''
\echo '===== 15. INVALID RISK VALUES ====='

SELECT
    game_risk_score_id,
    season,
    week,
    game_id,
    team_id,
    risk_score,
    risk_stars,
    risk_level
FROM risk.game_risk_scores
WHERE risk_score < 0
   OR risk_stars < 0
   OR risk_stars > 5
   OR risk_level NOT IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
ORDER BY season, week, game_id, team_id;

\echo ''
\echo '===== DATABASE VALIDATION COMPLETE ====='
