-- ====================================================================
-- SEMI-SHARP V2: INITIAL DATABASE SCHEMA AND PERSISTENCE FOUNDATION
-- ====================================================================

-- 1. Enable UUID Extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Schema Migration Tracker Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(100) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Teams Table
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

-- 4. Contests Table
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Contest Legs
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

-- 6. Games Table
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

-- 7. Team Week Lines
CREATE TABLE IF NOT EXISTS team_week_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    win_probability NUMERIC(5, 4) NOT NULL CHECK (win_probability BETWEEN 0.0 AND 1.0),
    pick_popularity NUMERIC(5, 4) NOT NULL CHECK (pick_popularity BETWEEN 0.0 AND 1.0),
    future_value NUMERIC(5, 4) NOT NULL CHECK (future_value BETWEEN 0.0 AND 1.0),
    leverage_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    holiday_safety_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    contest_equity_score NUMERIC(7, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_team_week_line UNIQUE (team_id, contest_leg_id)
);

-- 8. Survivor Entries
CREATE TABLE IF NOT EXISTS survivor_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'eliminated')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Survivor Picks
CREATE TABLE IF NOT EXISTS survivor_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES survivor_entries(id) ON DELETE CASCADE,
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id),
    pick_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (pick_status IN ('pending', 'won', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_entry_team_pick UNIQUE (entry_id, team_id),
    CONSTRAINT unique_entry_leg_pick UNIQUE (entry_id, contest_leg_id)
);

-- 10. Survivor History
CREATE TABLE IF NOT EXISTS survivor_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES survivor_entries(id) ON DELETE CASCADE,
    contest_leg_id UUID NOT NULL REFERENCES contest_legs(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES teams(id),
    result VARCHAR(50) NOT NULL CHECK (result IN ('won', 'lost', 'tie_loss')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Import Jobs Table
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    rows_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Weekly Inputs Table (Manual Research inputs)
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

-- 13. Team Features Table
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

-- 14. Game Features Table
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


-- ====================================================================
-- NEW COMPONENT SCHEMA SPECIFICATIONS (PROMPT 15)
-- ====================================================================

-- 15. Workflow Runs Table
CREATE TABLE IF NOT EXISTS workflow_runs (
    id VARCHAR(50) PRIMARY KEY,
    workflow_type VARCHAR(100) NOT NULL,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    requested_by VARCHAR(100),
    trigger_source VARCHAR(100),
    idempotency_key VARCHAR(100) UNIQUE,
    data_version VARCHAR(50),
    feature_version VARCHAR(50),
    inventory_version VARCHAR(50),
    risk_version VARCHAR(50),
    recommendation_version VARCHAR(50),
    simulation_version VARCHAR(50),
    policy_version VARCHAR(50),
    model_version VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
    id VARCHAR(50) PRIMARY KEY,
    workflow_run_id VARCHAR(50) NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    input_hash VARCHAR(100),
    output_hash VARCHAR(100),
    error_message TEXT,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Historical Snapshots (Immutable Audit Trial)
CREATE TABLE IF NOT EXISTS historical_snapshots (
    id VARCHAR(50) PRIMARY KEY,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    snapshot_type VARCHAR(100) NOT NULL,
    snapshot_json JSONB NOT NULL,
    data_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Recommendation Snapshots
CREATE TABLE IF NOT EXISTS recommendation_snapshots (
    id VARCHAR(50) PRIMARY KEY,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    recommendation_json JSONB NOT NULL,
    policy_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Audit Events Trackers (Immutability Enforced)
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(50) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    event_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Weekly Reports (Immutable History Enforced)
CREATE TABLE IF NOT EXISTS weekly_reports (
    id VARCHAR(50) PRIMARY KEY,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    report_json JSONB NOT NULL,
    report_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Research Exports (Immutable History Enforced)
CREATE TABLE IF NOT EXISTS research_exports (
    id VARCHAR(50) PRIMARY KEY,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    export_type VARCHAR(100) NOT NULL,
    artifact_path VARCHAR(255) NOT NULL,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_workflow_runs_type_status ON workflow_runs(workflow_type, status);
CREATE INDEX IF NOT EXISTS idx_historical_snapshots_lookup ON historical_snapshots(season, week, snapshot_type);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_lookup ON weekly_reports(season, week);
CREATE INDEX IF NOT EXISTS idx_research_exports_lookup ON research_exports(season, week, export_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_lookup ON audit_events(entity_type, entity_id);

-- Performance and Integrity Indexes from Core
CREATE INDEX IF NOT EXISTS idx_survivor_entries_status ON survivor_entries(status);
CREATE INDEX IF NOT EXISTS idx_survivor_picks_entry ON survivor_picks(entry_id);
CREATE INDEX IF NOT EXISTS idx_survivor_picks_leg ON survivor_picks(contest_leg_id);
CREATE INDEX IF NOT EXISTS idx_games_contest_leg ON games(contest_leg_id);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_team_week_lines_lookup ON team_week_lines(contest_leg_id, team_id);
CREATE INDEX IF NOT EXISTS idx_weekly_inputs_lookup ON weekly_inputs(contest_leg_id, team_id);
CREATE INDEX IF NOT EXISTS idx_team_features_lookup ON team_features(contest_leg_id, team_id);
CREATE INDEX IF NOT EXISTS idx_game_features_lookup ON game_features(contest_leg_id, home_team_id, away_team_id);
