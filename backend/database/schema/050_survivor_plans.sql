CREATE TABLE IF NOT EXISTS survivor_plans (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  planned_picks TEXT NOT NULL,
  projected_survival_probability DECIMAL(10,6) NOT NULL,
  future_value_remaining DECIMAL(5,2) NOT NULL,
  risk_index DECIMAL(5,2) NOT NULL,
  efficiency_score DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  agent_version VARCHAR(50) NOT NULL,
  plan_reasoning TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survivor_plans_season ON survivor_plans(season);
CREATE INDEX IF NOT EXISTS idx_survivor_plans_week ON survivor_plans(week);
CREATE INDEX IF NOT EXISTS idx_survivor_plans_entry_id ON survivor_plans(entry_id);
CREATE INDEX IF NOT EXISTS idx_survivor_plans_contest_id ON survivor_plans(contest_id);
