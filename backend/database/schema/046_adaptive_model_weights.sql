CREATE TABLE IF NOT EXISTS adaptive_model_weights (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  previous_weight DECIMAL(5,2) NOT NULL,
  recommended_weight DECIMAL(5,2) NOT NULL,
  weight_delta DECIMAL(5,2) NOT NULL,
  performance_score DECIMAL(5,2) NOT NULL,
  rolling_validation_score DECIMAL(5,2) NOT NULL,
  calibration_score DECIMAL(5,2) NOT NULL,
  clv_score DECIMAL(5,2) NOT NULL,
  drift_penalty DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  final_weight DECIMAL(5,2) NOT NULL,
  recommendation_reason TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_adaptive_model_weights_season ON adaptive_model_weights(season);
CREATE INDEX IF NOT EXISTS idx_adaptive_model_weights_week ON adaptive_model_weights(week);
CREATE INDEX IF NOT EXISTS idx_adaptive_model_weights_name ON adaptive_model_weights(model_name);
CREATE INDEX IF NOT EXISTS idx_adaptive_model_weights_type ON adaptive_model_weights(prediction_type);
