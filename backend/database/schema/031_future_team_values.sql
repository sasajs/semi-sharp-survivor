-- Migration V031: Future Team Values Schema
-- Safe to run repeatedly (Idempotent)

CREATE TABLE IF NOT EXISTS future_team_values (
  id SERIAL PRIMARY KEY,
  season VARCHAR(50) NOT NULL,
  week INT NOT NULL,
  team_id VARCHAR(50) NOT NULL,
  future_value_score DECIMAL(5,2) NOT NULL,
  future_value_rank INT NOT NULL,
  future_weeks_considered INT NOT NULL,
  calculation_version VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_future_team_values_season_week ON future_team_values(season, week);
CREATE INDEX IF NOT EXISTS idx_future_team_values_team ON future_team_values(team_id);
