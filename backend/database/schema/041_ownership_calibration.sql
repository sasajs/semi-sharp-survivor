CREATE TABLE IF NOT EXISTS ownership_calibration (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  baseline_ownership DECIMAL(5,2) NOT NULL,
  calibrated_ownership DECIMAL(5,2) NOT NULL,
  sharp_multiplier DECIMAL(5,2) NOT NULL,
  contest_size_factor DECIMAL(5,2) NOT NULL,
  variance_index DECIMAL(5,2) NOT NULL,
  calibration_score DECIMAL(5,2) NOT NULL,
  explanation TEXT NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_calib_season_week ON ownership_calibration(season, week);
CREATE INDEX IF NOT EXISTS idx_owner_calib_contest_id ON ownership_calibration(contest_id);
CREATE INDEX IF NOT EXISTS idx_owner_calib_team ON ownership_calibration(team_id);
