CREATE TABLE IF NOT EXISTS ownership_projections (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  projected_ownership_pct DECIMAL(5,2) NOT NULL,
  ownership_rank INT NOT NULL,
  ownership_tier VARCHAR(30) NOT NULL,
  projection_source VARCHAR(50) NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ownership_proj_season_week ON ownership_projections(season, week);
CREATE INDEX IF NOT EXISTS idx_ownership_proj_team ON ownership_projections(team_id);

CREATE TABLE IF NOT EXISTS contest_dynamics_snapshots (
  id SERIAL PRIMARY KEY,
  season VARCHAR(4) NOT NULL,
  week INT NOT NULL,
  entry_id VARCHAR(50) NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  projected_ownership_pct DECIMAL(5,2) NOT NULL,
  chalk_score DECIMAL(5,2) NOT NULL,
  leverage_score DECIMAL(5,2) NOT NULL,
  uniqueness_score DECIMAL(5,2) NOT NULL,
  contest_equity_adjustment DECIMAL(5,2) NOT NULL,
  strategy_profile VARCHAR(50) NOT NULL,
  calculation_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contest_dyn_season_week ON contest_dynamics_snapshots(season, week);
CREATE INDEX IF NOT EXISTS idx_contest_dyn_entry ON contest_dynamics_snapshots(entry_id);
CREATE INDEX IF NOT EXISTS idx_contest_dyn_team ON contest_dynamics_snapshots(team_id);
