CREATE TABLE IF NOT EXISTS championship_plans (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  planning_horizon VARCHAR(100) NOT NULL,
  weeks_remaining INT NOT NULL,
  recommended_team_id VARCHAR(50) NOT NULL,
  projected_finish_probability DECIMAL(10,6) NOT NULL,
  projected_championship_probability DECIMAL(10,6) NOT NULL,
  future_value_score DECIMAL(5,2) NOT NULL,
  inventory_score DECIMAL(5,2) NOT NULL,
  risk_score DECIMAL(5,2) NOT NULL,
  optimization_score DECIMAL(5,2) NOT NULL,
  recommended_path TEXT NOT NULL,
  alternative_paths TEXT NOT NULL,
  planner_version VARCHAR(50) NOT NULL,
  optimization_reason TEXT NOT NULL,
  optimization_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_championship_plans_season ON championship_plans(season);
CREATE INDEX IF NOT EXISTS idx_championship_plans_entry_id ON championship_plans(entry_id);
CREATE INDEX IF NOT EXISTS idx_championship_plans_contest_id ON championship_plans(contest_id);
CREATE INDEX IF NOT EXISTS idx_championship_plans_recommended_team_id ON championship_plans(recommended_team_id);
