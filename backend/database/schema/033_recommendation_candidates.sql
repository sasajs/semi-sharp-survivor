CREATE TABLE IF NOT EXISTS recommendation_candidates (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  candidate_rank INT NOT NULL,
  candidate_score DECIMAL(5,2) NOT NULL,
  survivor_equity_score DECIMAL(5,2) NOT NULL,
  future_team_value_score DECIMAL(5,2) NOT NULL,
  survival_probability DECIMAL(5,2) NOT NULL,
  strategy_profile VARCHAR(50) NOT NULL,
  eligibility_status VARCHAR(20) NOT NULL,
  eligibility_reason TEXT,
  explanation TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_candidates_season_week ON recommendation_candidates(season, week);
CREATE INDEX IF NOT EXISTS idx_rec_candidates_entry ON recommendation_candidates(entry_id);
CREATE INDEX IF NOT EXISTS idx_rec_candidates_team ON recommendation_candidates(team_id);
