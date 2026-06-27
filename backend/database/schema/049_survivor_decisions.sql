CREATE TABLE IF NOT EXISTS survivor_decisions (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  decision_policy_id INT,
  recommended_team_id VARCHAR(50) NOT NULL,
  confidence VARCHAR(50) NOT NULL,
  championship_ev DECIMAL(10,4) NOT NULL,
  future_value_score DECIMAL(5,2) NOT NULL,
  risk_score DECIMAL(5,2) NOT NULL,
  portfolio_score DECIMAL(5,2) NOT NULL,
  decision_score DECIMAL(5,2) NOT NULL,
  agent_version VARCHAR(50) NOT NULL,
  decision_reason TEXT NOT NULL,
  decision_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survivor_decisions_season ON survivor_decisions(season);
CREATE INDEX IF NOT EXISTS idx_survivor_decisions_week ON survivor_decisions(week);
CREATE INDEX IF NOT EXISTS idx_survivor_decisions_entry_id ON survivor_decisions(entry_id);
CREATE INDEX IF NOT EXISTS idx_survivor_decisions_contest_id ON survivor_decisions(contest_id);
CREATE INDEX IF NOT EXISTS idx_survivor_decisions_rec_team ON survivor_decisions(recommended_team_id);
