CREATE TABLE IF NOT EXISTS weekly_learning_history (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  engine_version VARCHAR(50) NOT NULL,
  model_hash VARCHAR(50) NOT NULL,
  policy_version VARCHAR(50) NOT NULL,
  data_version VARCHAR(50) NOT NULL,
  recommendations INT NOT NULL,
  correct_predictions INT NOT NULL,
  incorrect_predictions INT NOT NULL,
  accuracy DECIMAL(10,6) NOT NULL,
  average_confidence DECIMAL(10,6) NOT NULL,
  average_expected_value DECIMAL(10,6) NOT NULL,
  average_future_value DECIMAL(10,6) NOT NULL,
  average_championship_probability DECIMAL(10,6) NOT NULL,
  average_closing_line_value DECIMAL(10,6) NOT NULL,
  lessons_learned TEXT NOT NULL,
  strengths TEXT NOT NULL,
  weaknesses TEXT NOT NULL,
  recommendations_for_improvement TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_learning_season_week ON weekly_learning_history(season, week);

CREATE TABLE IF NOT EXISTS learning_trends (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  current_value DECIMAL(15,6) NOT NULL,
  previous_value DECIMAL(15,6) NOT NULL,
  percent_change DECIMAL(10,6) NOT NULL,
  trend_direction VARCHAR(10) NOT NULL,
  observation_count INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_trends_metric ON learning_trends(metric_name);
