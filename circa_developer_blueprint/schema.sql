-- ====================================================================
-- SEMI-SHARP V2: CIRCA SURVIVOR DATABASE SCHEMA (PostgreSQL DDL)
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(10) PRIMARY KEY, -- e.g., 'kc', 'bal', 'sf'
    name VARCHAR(100) NOT NULL UNIQUE,
    abbreviation VARCHAR(5) NOT NULL UNIQUE,
    bye_week INTEGER NOT NULL CHECK (bye_week BETWEEN 1 AND 18),
    primary_color VARCHAR(10) NOT NULL,
    secondary_color VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Contests Table
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Contest Legs (Circa Survivor has 20 separate legs including Holiday stages)
CREATE TABLE IF NOT EXISTS contest_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. 'Week 1', 'Thanksgiving / Black Friday'
    leg_type VARCHAR(50) NOT NULL CHECK (leg_type IN ('regular', 'thanksgiving', 'christmas')),
    display_order INTEGER NOT NULL, -- Sorting order 1-20
    nfl_week INTEGER NOT NULL CHECK (nfl_week BETWEEN 1 AND 18),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_contest_leg_order UNIQUE (contest_id, display_order)
);

-- 4. Games Table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    home_team_id VARCHAR(10) NOT NULL REFERENCES teams(id),
    away_team_id VARCHAR(10) NOT NULL REFERENCES teams(id),
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'final')),
    game_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_play CHECK (home_team_id <> away_team_id)
);

-- 5. Team Week Lines (Analytical parameters & Equity state per team per leg)
CREATE TABLE IF NOT EXISTS team_week_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    win_probability NUMERIC(5, 4) NOT NULL CHECK (win_probability BETWEEN 0.0 AND 1.0),
    pick_popularity NUMERIC(5, 4) NOT NULL CHECK (pick_popularity BETWEEN 0.0 AND 1.0),
    future_value NUMERIC(5, 4) NOT NULL CHECK (future_value BETWEEN 0.0 AND 1.0),
    leverage_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    holiday_safety_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    contest_equity_score NUMERIC(7, 4) NOT NULL, -- Calculated: win_probability * leverage * future_value_multiplier * holiday_safety
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_team_week_line UNIQUE (team_id, contest_leg_id)
);

-- 6. Survivor Entries
CREATE TABLE IF NOT EXISTS survivor_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'eliminated')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Survivor Picks (The record of who is picked for which leg)
CREATE TABLE IF NOT EXISTS survivor_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES survivor_entries(id) ON DELETE CASCADE,
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id),
    pick_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (pick_status IN ('pending', 'won', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Crucial business constraints:
    -- A team can only be selected once per entry
    CONSTRAINT unique_entry_team_pick UNIQUE (entry_id, team_id),
    -- An entry can only have one pick per contest leg
    CONSTRAINT unique_entry_leg_pick UNIQUE (entry_id, contest_leg_id)
);

-- 8. Survivor History (Auditing leg outcomes per entry)
CREATE TABLE IF NOT EXISTS survivor_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES survivor_entries(id) ON DELETE CASCADE,
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id),
    result VARCHAR(50) NOT NULL CHECK (result IN ('won', 'lost', 'tie_loss')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE AND INTEGRITY INDEXES
-- ====================================================================

-- Indexes for entries status monitoring
CREATE INDEX IF NOT EXISTS idx_survivor_entries_status ON survivor_entries(status);

-- Indexes for quick lookups on pick audits
CREATE INDEX IF NOT EXISTS idx_survivor_picks_entry ON survivor_picks(entry_id);
CREATE INDEX IF NOT EXISTS idx_survivor_picks_leg ON survivor_picks(contest_leg_id);

-- Speed up search on matching games for a specific leg or team
CREATE INDEX IF NOT EXISTS idx_games_contest_leg ON games(contest_leg_id);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);

-- Speed up optimization metrics searches
CREATE INDEX IF NOT EXISTS idx_team_week_lines_lookup ON team_week_lines(contest_leg_id, team_id);
CREATE INDEX IF NOT EXISTS idx_team_week_lines_score ON team_week_lines(contest_equity_score DESC);

-- 9. Import Jobs Table
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL, -- 'nfl_schedule', 'team_metrics', 'pff_spreadsheet', 'manual_inputs'
    file_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    rows_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Weekly Inputs Table (Manual Research inputs / SIC / Rest data)
CREATE TABLE IF NOT EXISTS weekly_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    rest_days INTEGER,
    rest_disparity INTEGER,
    sic_score NUMERIC(5, 2),
    injury_risk_score NUMERIC(5, 2),
    travel_disadvantage NUMERIC(5, 2),
    weather_risk NUMERIC(5, 2),
    quarterback_status VARCHAR(100),
    divisional_game_flag BOOLEAN DEFAULT FALSE,
    short_week_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_weekly_input UNIQUE (contest_leg_id, team_id)
);

-- 11. Team Features Table (Aggregated / Cached features per team-week)
CREATE TABLE IF NOT EXISTS team_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    off_efficiency NUMERIC(5, 2),
    def_efficiency NUMERIC(5, 2),
    net_efficiency NUMERIC(5, 2),
    injury_index NUMERIC(5, 2),
    pff_grade_offense NUMERIC(5, 2),
    pff_grade_defense NUMERIC(5, 2),
    dvoa_offense NUMERIC(5, 2),
    dvoa_defense NUMERIC(5, 2),
    rest_days INTEGER,
    sic_score NUMERIC(5, 2),
    quarterback_status VARCHAR(100),
    short_week_flag BOOLEAN DEFAULT FALSE,
    travel_disadvantage NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_team_feature UNIQUE (contest_leg_id, team_id)
);

-- 12. Game Features Table (Aggregated / Cached features per game/matchup)
CREATE TABLE IF NOT EXISTS game_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    home_team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    rest_disparity INTEGER,
    weather_risk NUMERIC(5, 2),
    divisional_game_flag BOOLEAN DEFAULT FALSE,
    line_spread NUMERIC(5, 2),
    over_under NUMERIC(5, 2),
    home_win_probability_pff NUMERIC(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_game_feature UNIQUE (contest_leg_id, home_team_id, away_team_id)
);

-- Indexes for the new feature tables
CREATE INDEX IF NOT EXISTS idx_weekly_inputs_lookup ON weekly_inputs(contest_leg_id, team_id);
CREATE INDEX IF NOT EXISTS idx_team_features_lookup ON team_features(contest_leg_id, team_id);
CREATE INDEX IF NOT EXISTS idx_game_features_lookup ON game_features(contest_leg_id, home_team_id, away_team_id);

