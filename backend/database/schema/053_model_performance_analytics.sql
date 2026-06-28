CREATE TABLE IF NOT EXISTS model_performance_history (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  engine_version VARCHAR(50) NOT NULL,
  model_hash VARCHAR(50) NOT NULL,
  data_version VARCHAR(50) NOT NULL,
  policy_version VARCHAR(50) NOT NULL,
  prediction_count INT NOT NULL,
  accuracy DECIMAL(10,6) NOT NULL,
  log_loss DECIMAL(10,6) NOT NULL,
  brier_score DECIMAL(10,6) NOT NULL,
  calibration_error DECIMAL(10,6) NOT NULL,
  average_confidence DECIMAL(10,6) NOT NULL,
  average_expected_value DECIMAL(10,6) NOT NULL,
  average_closing_line_value DECIMAL(10,6) NOT NULL,
  average_survival_probability DECIMAL(10,6) NOT NULL,
  average_championship_probability DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_perf_history_season_week ON model_performance_history(season, week);
CREATE INDEX IF NOT EXISTS idx_model_perf_history_hash ON model_performance_history(model_hash);

CREATE TABLE IF NOT EXISTS model_performance_summary (
  id SERIAL PRIMARY KEY,
  model_hash VARCHAR(50) NOT NULL,
  engine_version VARCHAR(50) NOT NULL,
  games_evaluated INT NOT NULL,
  rolling_accuracy DECIMAL(10,6) NOT NULL,
  rolling_log_loss DECIMAL(10,6) NOT NULL,
  rolling_brier_score DECIMAL(10,6) NOT NULL,
  rolling_calibration_error DECIMAL(10,6) NOT NULL,
  rolling_expected_value DECIMAL(10,6) NOT NULL,
  rolling_closing_line_value DECIMAL(10,6) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_model_perf_summary_hash ON model_performance_summary(model_hash);
