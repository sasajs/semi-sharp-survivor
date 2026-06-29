CREATE TABLE IF NOT EXISTS model_weights (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  current_weight DECIMAL(10,6) NOT NULL,
  normalized_weight DECIMAL(10,6) NOT NULL,
  rolling_accuracy DECIMAL(10,6) NOT NULL,
  rolling_brier DECIMAL(10,6) NOT NULL,
  rolling_logloss DECIMAL(10,6) NOT NULL,
  calibration_score DECIMAL(10,6) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_model_weights_name_type ON model_weights(model_name, prediction_type);

CREATE TABLE IF NOT EXISTS model_weight_history (
  id SERIAL PRIMARY KEY,
  week INT NOT NULL,
  season VARCHAR(10) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  previous_weight DECIMAL(10,6) NOT NULL,
  new_weight DECIMAL(10,6) NOT NULL,
  reason TEXT NOT NULL,
  metrics_snapshot TEXT NOT NULL,
  policy_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
