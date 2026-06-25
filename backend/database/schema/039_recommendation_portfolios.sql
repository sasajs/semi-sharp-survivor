CREATE TABLE IF NOT EXISTS recommendation_portfolios (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  portfolio_id VARCHAR(50) NOT NULL,
  strategy VARCHAR(50) NOT NULL DEFAULT 'BALANCED',
  entry_id VARCHAR(50) NOT NULL,
  recommended_team_id VARCHAR(10) NOT NULL,
  recommendation_score DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  consensus_score DECIMAL(5,2) NOT NULL,
  allocation_rank INT NOT NULL,
  diversification_score DECIMAL(5,2) NOT NULL,
  correlation_penalty DECIMAL(5,2) NOT NULL,
  portfolio_score DECIMAL(5,2) NOT NULL,
  allocation_reason TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_port_season_week ON recommendation_portfolios(season, week);
CREATE INDEX IF NOT EXISTS idx_rec_port_portfolio ON recommendation_portfolios(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_rec_port_entry ON recommendation_portfolios(entry_id);
CREATE INDEX IF NOT EXISTS idx_rec_port_team ON recommendation_portfolios(recommended_team_id);
CREATE INDEX IF NOT EXISTS idx_rec_port_strategy ON recommendation_portfolios(strategy);

