CREATE TABLE IF NOT EXISTS rolling_validation (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  start_week INT NOT NULL,
  end_week INT NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  games_evaluated INT NOT NULL,
  wins INT NOT NULL,
  losses INT NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  brier_score DECIMAL(5,4) NOT NULL,
  log_loss DECIMAL(5,4) NOT NULL,
  rmse DECIMAL(5,2) NOT NULL,
  mae DECIMAL(5,2) NOT NULL,
  spread_clv DECIMAL(5,2) NOT NULL,
  total_clv DECIMAL(5,2) NOT NULL,
  rolling_score DECIMAL(5,2) NOT NULL,
  drift_score DECIMAL(5,2) NOT NULL,
  recommended_action VARCHAR(50) NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roll_val_season ON rolling_validation(season);
CREATE INDEX IF NOT EXISTS idx_roll_val_model ON rolling_validation(model_name);
CREATE INDEX IF NOT EXISTS idx_roll_val_type ON rolling_validation(prediction_type);
