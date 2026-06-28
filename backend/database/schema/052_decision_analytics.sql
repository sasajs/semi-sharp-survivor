CREATE TABLE IF NOT EXISTS decision_analytics (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  recommendation_id VARCHAR(50) NOT NULL,
  engine_version VARCHAR(50) NOT NULL,
  model_hash VARCHAR(50) NOT NULL,
  policy_version VARCHAR(50) NOT NULL,
  data_version VARCHAR(50) NOT NULL,
  workflow_version VARCHAR(50) NOT NULL,
  recommendation_type VARCHAR(100) NOT NULL,
  selected_team VARCHAR(50) NOT NULL,
  projected_survival_probability DECIMAL(10,6) NOT NULL,
  projected_championship_probability DECIMAL(10,6) NOT NULL,
  projected_expected_value DECIMAL(10,6) NOT NULL,
  projected_future_value DECIMAL(10,6) NOT NULL,
  recommendation_rank INT NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_decision_analytics_season_week ON decision_analytics(season, week);
CREATE INDEX IF NOT EXISTS idx_decision_analytics_rec_id ON decision_analytics(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_decision_analytics_team ON decision_analytics(selected_team);

CREATE TABLE IF NOT EXISTS decision_outcomes (
  id SERIAL PRIMARY KEY,
  decision_id INT NOT NULL,
  game_result VARCHAR(50) NOT NULL,
  survived BOOLEAN NOT NULL,
  eliminated BOOLEAN NOT NULL,
  actual_win_probability DECIMAL(10,6) NOT NULL,
  market_open_line DECIMAL(10,2) NOT NULL,
  closing_line DECIMAL(10,2) NOT NULL,
  closing_line_value DECIMAL(10,2) NOT NULL,
  evaluation_notes TEXT NOT NULL,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_decision_outcomes_decision_id ON decision_outcomes(decision_id);

CREATE TABLE IF NOT EXISTS weekly_decision_summary (
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  recommendations INT NOT NULL,
  wins INT NOT NULL,
  losses INT NOT NULL,
  survival_rate DECIMAL(10,6) NOT NULL,
  average_confidence DECIMAL(5,2) NOT NULL,
  average_expected_value DECIMAL(10,6) NOT NULL,
  average_future_value DECIMAL(10,6) NOT NULL,
  average_championship_probability DECIMAL(10,6) NOT NULL,
  average_closing_line_value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (season, week)
);
