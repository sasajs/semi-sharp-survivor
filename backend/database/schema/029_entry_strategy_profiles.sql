-- Migration V029: Entry Strategy Profiles and Metadata Schema
-- Safe to run repeatedly (Idempotent)

CREATE TABLE IF NOT EXISTS entry_metadata (
  entry_id VARCHAR(100) PRIMARY KEY,
  owner_name VARCHAR(255) NOT NULL,
  entry_description TEXT,
  entry_notes TEXT,
  primary_goal VARCHAR(255) NOT NULL,
  secondary_goal VARCHAR(255),
  active_flag BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entry_strategy_profiles (
  profile_id SERIAL PRIMARY KEY,
  entry_id VARCHAR(100) UNIQUE NOT NULL REFERENCES entry_metadata(entry_id) ON DELETE CASCADE,
  strategy_type VARCHAR(100) NOT NULL,
  objective TEXT NOT NULL,
  risk_tolerance VARCHAR(100) NOT NULL,
  diversification_group VARCHAR(100),
  marketplace_target VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure Circa Survivor 2026 contest exists before entry seed inserts.
INSERT INTO contests (id, name, year, status)
SELECT
  '20262026-c17c-4c0a-bd6e-000000000001',
  'Circa Survivor 2026',
  2026,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM contests
  WHERE id = '20262026-c17c-4c0a-bd6e-000000000001'
);

-- Seed initial real-world entries into survivor_entries if they don't already exist.
-- Match the Circa Survivor contest ID UUID: 20262026-c17c-4c0a-bd6e-000000000001
-- Match specific entry UUID slots to stay consistent with custom mapped UUID prefixes (22222222-2222-4222-c222-...)
INSERT INTO survivor_entries (id, contest_id, name, status, notes)
SELECT '22222222-2222-4222-c222-000000000101', '20262026-c17c-4c0a-bd6e-000000000001', 'UWOSH-1', 'alive', 'Steve''s Entry 1'
WHERE NOT EXISTS (SELECT 1 FROM survivor_entries WHERE name = 'UWOSH-1');

INSERT INTO survivor_entries (id, contest_id, name, status, notes)
SELECT '22222222-2222-4222-c222-000000000102', '20262026-c17c-4c0a-bd6e-000000000001', 'UWOSH-2', 'alive', 'Steve''s Entry 2'
WHERE NOT EXISTS (SELECT 1 FROM survivor_entries WHERE name = 'UWOSH-2');

INSERT INTO survivor_entries (id, contest_id, name, status, notes)
SELECT '22222222-2222-4222-c222-000000000103', '20262026-c17c-4c0a-bd6e-000000000001', 'UWOSH-3', 'alive', 'Cameron''s Entry'
WHERE NOT EXISTS (SELECT 1 FROM survivor_entries WHERE name = 'UWOSH-3');

INSERT INTO survivor_entries (id, contest_id, name, status, notes)
SELECT '22222222-2222-4222-c222-000000000104', '20262026-c17c-4c0a-bd6e-000000000001', 'UWOSH-4', 'alive', 'UW Oshkosh Group Entry'
WHERE NOT EXISTS (SELECT 1 FROM survivor_entries WHERE name = 'UWOSH-4');

-- Seed entry_metadata
INSERT INTO entry_metadata (entry_id, owner_name, entry_description, entry_notes, primary_goal, secondary_goal, active_flag)
SELECT 'UWOSH-1', 'Steve', 'UWOSH-1 Steve Entry', 'High Priority', 'Maximize championship expected value', 'ROI optimization', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entry_metadata WHERE entry_id = 'UWOSH-1');

INSERT INTO entry_metadata (entry_id, owner_name, entry_description, entry_notes, primary_goal, secondary_goal, active_flag)
SELECT 'UWOSH-2', 'Steve', 'UWOSH-2 Steve Entry', 'Portfolio entry', 'Portfolio diversification', 'Jointly optimize with UWOSH-1', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entry_metadata WHERE entry_id = 'UWOSH-2');

INSERT INTO entry_metadata (entry_id, owner_name, entry_description, entry_notes, primary_goal, secondary_goal, active_flag)
SELECT 'UWOSH-3', 'Cameron', 'UWOSH-3 Cameron Entry', 'Marketplace resale focus', 'Survive into mid-season', 'Increase marketplace resale value', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entry_metadata WHERE entry_id = 'UWOSH-3');

INSERT INTO entry_metadata (entry_id, owner_name, entry_description, entry_notes, primary_goal, secondary_goal, active_flag)
SELECT 'UWOSH-4', 'UW Oshkosh Group Entry', '9 total participants.', 'Low risk focus', 'Maximize survival probability', 'Avoid aggressive strategies', TRUE
WHERE NOT EXISTS (SELECT 1 FROM entry_metadata WHERE entry_id = 'UWOSH-4');

-- Seed entry_strategy_profiles
INSERT INTO entry_strategy_profiles (entry_id, strategy_type, objective, risk_tolerance, diversification_group, marketplace_target, notes)
SELECT 'UWOSH-1', 'CHAMPIONSHIP_EV', 'Maximize championship expected value.', 'HIGH', 'UWOSH_GROUP', 'NONE', 'Steve first entry'
WHERE NOT EXISTS (SELECT 1 FROM entry_strategy_profiles WHERE entry_id = 'UWOSH-1');

INSERT INTO entry_strategy_profiles (entry_id, strategy_type, objective, risk_tolerance, diversification_group, marketplace_target, notes)
SELECT 'UWOSH-2', 'PORTFOLIO_EV', 'Optimize jointly with UWOSH-1. Avoid unnecessary duplicate selections. Maximize combined portfolio EV.', 'MEDIUM', 'UWOSH_GROUP', 'NONE', 'Steve second entry (portfolio logic)'
WHERE NOT EXISTS (SELECT 1 FROM entry_strategy_profiles WHERE entry_id = 'UWOSH-2');

INSERT INTO entry_strategy_profiles (entry_id, strategy_type, objective, risk_tolerance, diversification_group, marketplace_target, notes)
SELECT 'UWOSH-3', 'MARKETPLACE_SURVIVAL', 'Survive into mid-season to increase marketplace resale value. Favor safer selections early. Lower volatility.', 'LOW', 'CAMERON', 'MID_SEASON', 'Cameron marketplace survival entry'
WHERE NOT EXISTS (SELECT 1 FROM entry_strategy_profiles WHERE entry_id = 'UWOSH-3');

INSERT INTO entry_strategy_profiles (entry_id, strategy_type, objective, risk_tolerance, diversification_group, marketplace_target, notes)
SELECT 'UWOSH-4', 'GROUP_SURVIVAL', '9 total participants. Maximize survival probability. Reduce risk. Avoid aggressive strategies.', 'VERY_LOW', 'UWOSH_GROUP_4', 'NONE', 'UW Oshkosh Group entry (9 participants)'
WHERE NOT EXISTS (SELECT 1 FROM entry_strategy_profiles WHERE entry_id = 'UWOSH-4');
