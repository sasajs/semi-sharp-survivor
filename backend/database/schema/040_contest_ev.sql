CREATE TABLE IF NOT EXISTS contest_ev (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  recommended_team_id VARCHAR(10) NOT NULL,
  contest_size INT NOT NULL,
  remaining_entries INT NOT NULL,
  estimated_ownership DECIMAL(5,2) NOT NULL,
  win_probability DECIMAL(5,4) NOT NULL,
  future_team_value DECIMAL(5,2) NOT NULL,
  survivor_equity DECIMAL(5,2) NOT NULL,
  portfolio_score DECIMAL(5,2) NOT NULL,
  consensus_score DECIMAL(5,2) NOT NULL,
  contest_ev_score DECIMAL(5,2) NOT NULL,
  championship_probability DECIMAL(5,2) NOT NULL,
  risk_adjustment DECIMAL(5,2) NOT NULL,
  explanation TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  contest_type VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contest_ev_season_week ON contest_ev(season, week);
CREATE INDEX IF NOT EXISTS idx_contest_ev_contest_id ON contest_ev(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_ev_entry_id ON contest_ev(entry_id);
CREATE INDEX IF NOT EXISTS idx_contest_ev_team ON contest_ev(recommended_team_id);
