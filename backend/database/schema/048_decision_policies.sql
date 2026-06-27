CREATE TABLE IF NOT EXISTS decision_policies (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  game_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(50) NOT NULL,
  policy_type VARCHAR(50) NOT NULL,
  ensemble_prediction DECIMAL(5,2) NOT NULL,
  ensemble_confidence DECIMAL(5,2) NOT NULL,
  contest_ev DECIMAL(5,2) NOT NULL,
  portfolio_score DECIMAL(5,2) NOT NULL,
  risk_score DECIMAL(5,2) NOT NULL,
  leverage_score DECIMAL(5,2) NOT NULL,
  decision_score DECIMAL(5,2) NOT NULL,
  recommended_action VARCHAR(50) NOT NULL,
  recommended_pick VARCHAR(50) NOT NULL,
  confidence_tier VARCHAR(50) NOT NULL,
  policy_reason TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_decision_policies_season ON decision_policies(season);
CREATE INDEX IF NOT EXISTS idx_decision_policies_week ON decision_policies(week);
CREATE INDEX IF NOT EXISTS idx_decision_policies_entry_id ON decision_policies(entry_id);
CREATE INDEX IF NOT EXISTS idx_decision_policies_contest_id ON decision_policies(contest_id);
CREATE INDEX IF NOT EXISTS idx_decision_policies_team_id ON decision_policies(team_id);
