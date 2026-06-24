CREATE TABLE IF NOT EXISTS recommendation_audits (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  previous_rank INT,
  current_rank INT,
  rank_delta INT NOT NULL,
  previous_score DECIMAL(5,2),
  current_score DECIMAL(5,2),
  score_delta DECIMAL(5,2) NOT NULL,
  previous_tier VARCHAR(50),
  current_tier VARCHAR(50),
  candidate_score_delta DECIMAL(5,2) NOT NULL,
  survivor_equity_delta DECIMAL(5,2) NOT NULL,
  future_value_delta DECIMAL(5,2) NOT NULL,
  ownership_delta DECIMAL(5,2) NOT NULL,
  contest_dynamics_delta DECIMAL(5,2) NOT NULL,
  change_category VARCHAR(50) NOT NULL,
  audit_summary TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_aud_season_week ON recommendation_audits(season, week);
CREATE INDEX IF NOT EXISTS idx_rec_aud_entry ON recommendation_audits(entry_id);
CREATE INDEX IF NOT EXISTS idx_rec_aud_team ON recommendation_audits(team_id);
