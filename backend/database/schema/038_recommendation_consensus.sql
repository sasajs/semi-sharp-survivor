CREATE TABLE IF NOT EXISTS recommendation_consensus (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  candidate_score DECIMAL(5,2) NOT NULL,
  survivor_equity_score DECIMAL(5,2) NOT NULL,
  recommendation_score DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  ownership_score DECIMAL(5,2) NOT NULL,
  future_value_score DECIMAL(5,2) NOT NULL,
  consensus_score DECIMAL(5,2) NOT NULL,
  agreement_count INT NOT NULL,
  consensus_tier VARCHAR(50) NOT NULL,
  consensus_summary TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_con_season_week ON recommendation_consensus(season, week);
CREATE INDEX IF NOT EXISTS idx_rec_con_entry ON recommendation_consensus(entry_id);
CREATE INDEX IF NOT EXISTS idx_rec_con_team ON recommendation_consensus(team_id);
