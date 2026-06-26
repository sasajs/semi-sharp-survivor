CREATE TABLE IF NOT EXISTS model_drift (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  baseline_accuracy DECIMAL(5,2) NOT NULL,
  current_accuracy DECIMAL(5,2) NOT NULL,
  accuracy_delta DECIMAL(5,2) NOT NULL,
  baseline_brier_score DECIMAL(5,4) NOT NULL,
  current_brier_score DECIMAL(5,4) NOT NULL,
  brier_delta DECIMAL(5,4) NOT NULL,
  baseline_clv DECIMAL(5,2) NOT NULL,
  current_clv DECIMAL(5,2) NOT NULL,
  clv_delta DECIMAL(5,2) NOT NULL,
  drift_score DECIMAL(5,2) NOT NULL,
  drift_level VARCHAR(50) NOT NULL,
  recommended_action VARCHAR(50) NOT NULL,
  recommended_priority VARCHAR(50) NOT NULL,
  explanation TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_drift_season ON model_drift(season);
CREATE INDEX IF NOT EXISTS idx_model_drift_week ON model_drift(week);
CREATE INDEX IF NOT EXISTS idx_model_drift_name ON model_drift(model_name);
CREATE INDEX IF NOT EXISTS idx_model_drift_type ON model_drift(prediction_type);
