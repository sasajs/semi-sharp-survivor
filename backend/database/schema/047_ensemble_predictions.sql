CREATE TABLE IF NOT EXISTS ensemble_predictions (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  game_id VARCHAR(50) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  ensemble_prediction DECIMAL(5,2) NOT NULL,
  prediction_std_dev DECIMAL(5,2) NOT NULL,
  prediction_variance DECIMAL(5,2) NOT NULL,
  confidence_interval_low DECIMAL(5,2) NOT NULL,
  confidence_interval_high DECIMAL(5,2) NOT NULL,
  model_count INT NOT NULL,
  weighted_prediction DECIMAL(5,2) NOT NULL,
  agreement_score DECIMAL(5,2) NOT NULL,
  disagreement_score DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  recommended_usage VARCHAR(50) NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_season ON ensemble_predictions(season);
CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_week ON ensemble_predictions(week);
CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_game_id ON ensemble_predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_type ON ensemble_predictions(prediction_type);
