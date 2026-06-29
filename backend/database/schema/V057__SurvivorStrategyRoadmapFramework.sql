-- Migration V057: Survivor Strategy & Roadmap Framework Tables
-- Safe to run repeatedly

CREATE TABLE IF NOT EXISTS survivor_entry_strategies (
  id SERIAL PRIMARY KEY,
  entry_id VARCHAR(50) NOT NULL,
  strategy_type VARCHAR(50) NOT NULL,
  strategy_name VARCHAR(100) NOT NULL,
  strategy_description TEXT,
  risk_tolerance VARCHAR(50),
  diversification_weight DECIMAL(10,6),
  future_value_weight DECIMAL(10,6),
  survival_weight DECIMAL(10,6),
  ownership_leverage_weight DECIMAL(10,6),
  marketplace_weight DECIMAL(10,6),
  consensus_weight DECIMAL(10,6),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survivor_holiday_reservations (
  id SERIAL PRIMARY KEY,
  entry_id VARCHAR(50) NOT NULL,
  season VARCHAR(10) NOT NULL,
  holiday_type VARCHAR(50) NOT NULL,
  reserved_team_id VARCHAR(50),
  alternate_team_id VARCHAR(50),
  confidence_score DECIMAL(10,6),
  reservation_reason TEXT,
  strategy_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survivor_entry_roadmaps (
  id SERIAL PRIMARY KEY,
  entry_id VARCHAR(50) NOT NULL,
  season VARCHAR(10) NOT NULL,
  generated_week INT NOT NULL,
  strategy_type VARCHAR(50) NOT NULL,
  roadmap_version VARCHAR(50) NOT NULL,
  total_projected_survival DECIMAL(10,6),
  total_projected_equity DECIMAL(10,6),
  portfolio_correlation_score DECIMAL(10,6),
  roadmap_confidence DECIMAL(10,6),
  generated_reason TEXT,
  model_version VARCHAR(50),
  policy_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survivor_entry_roadmap_weeks (
  id SERIAL PRIMARY KEY,
  roadmap_id INT NOT NULL,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  recommended_team_id VARCHAR(50),
  alternate_team_id VARCHAR(50),
  win_probability DECIMAL(10,6),
  future_value_cost DECIMAL(10,6),
  contest_equity_score DECIMAL(10,6),
  ownership_projection DECIMAL(10,6),
  roadmap_note TEXT,
  is_current_week BOOLEAN DEFAULT FALSE,
  is_holiday_week BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_survivor_entry_strategies_entry_id ON survivor_entry_strategies(entry_id);
CREATE INDEX IF NOT EXISTS idx_survivor_holiday_reservations_entry_id_season ON survivor_holiday_reservations(entry_id, season);
CREATE INDEX IF NOT EXISTS idx_survivor_entry_roadmaps_entry_id_season ON survivor_entry_roadmaps(entry_id, season);
CREATE INDEX IF NOT EXISTS idx_survivor_entry_roadmap_weeks_roadmap_id ON survivor_entry_roadmap_weeks(roadmap_id);
