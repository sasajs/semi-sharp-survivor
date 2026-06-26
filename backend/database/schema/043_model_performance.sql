CREATE TABLE IF NOT EXISTS model_performance (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  games_evaluated INT NOT NULL,
  correct_predictions INT NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  brier_score DECIMAL(5,4) NOT NULL,
  log_loss DECIMAL(5,4) NOT NULL,
  rmse DECIMAL(5,2) NOT NULL,
  mae DECIMAL(5,2) NOT NULL,
  spread_clv DECIMAL(5,2) NOT NULL,
  total_clv DECIMAL(5,2) NOT NULL,
  calibration_score DECIMAL(5,2) NOT NULL,
  rolling_score DECIMAL(5,2) NOT NULL,
  performance_weight DECIMAL(5,2) NOT NULL,
  recommended_weight DECIMAL(5,2) NOT NULL,
  active_weight DECIMAL(5,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_perf_season_week ON model_performance(season, week);
CREATE INDEX IF NOT EXISTS idx_model_perf_name ON model_performance(model_name);
CREATE INDEX IF NOT EXISTS idx_model_perf_type ON model_performance(prediction_type);
