-- Migration V028: Feature Store Foundation Schema
-- Safe to run repeatedly (Idempotent)

CREATE TABLE IF NOT EXISTS feature_definitions (
  feature_id VARCHAR(100) PRIMARY KEY,
  feature_name VARCHAR(150) NOT NULL,
  feature_category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  sport VARCHAR(50) NOT NULL,
  active_flag BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_snapshots (
  snapshot_id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  sport VARCHAR(50) NOT NULL,
  team_id VARCHAR(100) NOT NULL,
  game_id VARCHAR(100),
  feature_id VARCHAR(100) NOT NULL REFERENCES feature_definitions(feature_id),
  feature_value NUMERIC(12, 4) NOT NULL,
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_build_runs (
  run_id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  feature_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  build_version VARCHAR(100) NOT NULL,
  notes TEXT
);

-- Seed initial feature definitions if they don't already exist
INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag)
SELECT 'days_rest', 'Days of Rest', 'Scheduling', 'Total rest days prior to the game kickoff.', 'NFL', TRUE
WHERE NOT EXISTS (SELECT 1 FROM feature_definitions WHERE feature_id = 'days_rest');

INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag)
SELECT 'home_field_advantage', 'Home Field Advantage', 'Situational', 'Binary indicator (1.0 or 0.0) of whether the team has home field advantage in the game.', 'NFL', TRUE
WHERE NOT EXISTS (SELECT 1 FROM feature_definitions WHERE feature_id = 'home_field_advantage');

INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag)
SELECT 'market_spread', 'Market Spread', 'Market', 'Official betting line market spread for the team (negative for favorites, positive for underdogs).', 'NFL', TRUE
WHERE NOT EXISTS (SELECT 1 FROM feature_definitions WHERE feature_id = 'market_spread');

INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag)
SELECT 'market_total', 'Market Over/Under Total', 'Market', 'Official betting line total over/under projection for the game.', 'NFL', TRUE
WHERE NOT EXISTS (SELECT 1 FROM feature_definitions WHERE feature_id = 'market_total');

INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag)
SELECT 'team_win_pct', 'Team Win Percentage', 'Performance', 'The historical winning percentage of the team leading up to the current week.', 'NFL', TRUE
WHERE NOT EXISTS (SELECT 1 FROM feature_definitions WHERE feature_id = 'team_win_pct');

INSERT INTO feature_definitions (feature_id, feature_name, feature_category, description, sport, active_flag)
SELECT 'future_team_value', 'Future Team Value', 'Long-term', 'Projected future valuation multiplier for survivor or simulation weightings.', 'NFL', TRUE
WHERE NOT EXISTS (SELECT 1 FROM feature_definitions WHERE feature_id = 'future_team_value');
