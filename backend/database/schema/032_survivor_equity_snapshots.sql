-- Migration V032: Survivor Equity Snapshots Schema
-- Safe to run repeatedly (Idempotent)

CREATE TABLE IF NOT EXISTS survivor_equity_snapshots (
  id SERIAL PRIMARY KEY,
  season VARCHAR(50) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(50) NOT NULL,
  survival_probability DECIMAL(5,2) NOT NULL,
  future_team_value DECIMAL(5,2) NOT NULL,
  equity_score DECIMAL(5,2) NOT NULL,
  equity_rank INT NOT NULL,
  strategy_profile VARCHAR(100) NOT NULL,
  calculation_version VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survivor_equity_snapshots_season_week ON survivor_equity_snapshots(season, week);
CREATE INDEX IF NOT EXISTS idx_survivor_equity_snapshots_entry ON survivor_equity_snapshots(entry_id);
CREATE INDEX IF NOT EXISTS idx_survivor_equity_snapshots_team ON survivor_equity_snapshots(team_id);

-- Register 'survivor_equity' as an official feature in the Feature Store definitions table
INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag)
SELECT 'survivor_equity', 'Survivor Equity', 'Contest Value', 'Estimated contest equity gain of surviving the week with a given team choice, weighted by entry-specific strategy profile.', 'NFL', TRUE
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_definitions')
  AND NOT EXISTS (SELECT 1 FROM feature_definitions WHERE feature_id = 'survivor_equity');

