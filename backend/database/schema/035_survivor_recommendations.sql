CREATE TABLE IF NOT EXISTS survivor_recommendations (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  recommended_team_id VARCHAR(10) NOT NULL,
  recommendation_rank INT NOT NULL,
  recommendation_score DECIMAL(5,2) NOT NULL,
  candidate_score DECIMAL(5,2) NOT NULL,
  survivor_equity_score DECIMAL(5,2) NOT NULL,
  future_team_value_score DECIMAL(5,2) NOT NULL,
  projected_ownership_pct DECIMAL(5,2) NOT NULL,
  contest_equity_adjustment DECIMAL(5,2) NOT NULL,
  strategy_profile VARCHAR(50) NOT NULL,
  recommendation_tier VARCHAR(50) NOT NULL,
  recommendation_reason TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_surv_rec_season_week ON survivor_recommendations(season, week);
CREATE INDEX IF NOT EXISTS idx_surv_rec_entry ON survivor_recommendations(entry_id);
CREATE INDEX IF NOT EXISTS idx_surv_rec_team ON survivor_recommendations(recommended_team_id);
