CREATE TABLE IF NOT EXISTS market_calibration (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  game_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  opening_spread DECIMAL(5,2) NOT NULL,
  closing_spread DECIMAL(5,2) NOT NULL,
  model_spread DECIMAL(5,2) NOT NULL,
  spread_clv DECIMAL(5,2) NOT NULL,
  opening_total DECIMAL(5,2) NOT NULL,
  closing_total DECIMAL(5,2) NOT NULL,
  model_total DECIMAL(5,2) NOT NULL,
  total_clv DECIMAL(5,2) NOT NULL,
  market_direction VARCHAR(50) NOT NULL,
  prediction_error DECIMAL(5,2) NOT NULL,
  market_edge DECIMAL(5,2) NOT NULL,
  calibration_weight DECIMAL(5,2) NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mkt_calib_season_week ON market_calibration(season, week);
CREATE INDEX IF NOT EXISTS idx_mkt_calib_game_id ON market_calibration(game_id);
CREATE INDEX IF NOT EXISTS idx_mkt_calib_team ON market_calibration(team_id);
