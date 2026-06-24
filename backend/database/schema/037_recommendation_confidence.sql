CREATE TABLE IF NOT EXISTS recommendation_confidence_snapshots (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  recommendation_rank INT NOT NULL,
  recommendation_score DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  stability_score DECIMAL(5,2) NOT NULL,
  score_gap_to_next DECIMAL(5,2) NOT NULL,
  score_gap_to_top DECIMAL(5,2) NOT NULL,
  recommendation_volatility DECIMAL(5,2) NOT NULL,
  confidence_tier VARCHAR(50) NOT NULL,
  stability_tier VARCHAR(50) NOT NULL,
  explanation TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_conf_season_week ON recommendation_confidence_snapshots(season, week);
CREATE INDEX IF NOT EXISTS idx_rec_conf_entry ON recommendation_confidence_snapshots(entry_id);
CREATE INDEX IF NOT EXISTS idx_rec_conf_team ON recommendation_confidence_snapshots(team_id);
