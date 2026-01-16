-- =========================
-- Reference Tables (Mutable)
-- =========================

CREATE TABLE teams (
    team_id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    conference TEXT,
    division TEXT
);

CREATE TABLE stadiums (
    stadium_id TEXT PRIMARY KEY,
    stadium_name TEXT NOT NULL,
    roof_type TEXT
);

CREATE TABLE season_calendar (
    season INT NOT NULL,
    week INT NOT NULL,
    week_start DATE,
    week_end DATE,
    PRIMARY KEY (season, week)
);

-- =========================
-- History Tables (Immutable)
-- =========================

CREATE TABLE features_history (
    season INT NOT NULL,
    week INT NOT NULL,
    data_version TEXT NOT NULL,
    model_hash TEXT,
    policy_version TEXT,
    features JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (season, week, data_version, model_hash)
);

CREATE TABLE model_predictions_history (
    season INT NOT NULL,
    week INT NOT NULL,
    data_version TEXT NOT NULL,
    model_hash TEXT NOT NULL,
    predictions JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (season, week, data_version, model_hash)
);

CREATE TABLE agent_decisions_history (
    season INT NOT NULL,
    week INT NOT NULL,
    data_version TEXT NOT NULL,
    policy_version TEXT NOT NULL,
    decisions JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (season, week, data_version, policy_version)
);

CREATE TABLE evaluation_metrics_history (
    season INT NOT NULL,
    week INT NOT NULL,
    data_version TEXT NOT NULL,
    model_hash TEXT,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (season, week, data_version, model_hash)
);

CREATE TABLE report_artifacts (
    season INT NOT NULL,
    week INT NOT NULL,
    data_version TEXT NOT NULL,
    artifact_type TEXT NOT NULL,
    artifact_path TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (season, week, data_version, artifact_type)
);

-- =========================
-- Enforce Immutability
-- =========================

CREATE OR REPLACE FUNCTION forbid_modifications()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'History tables are immutable';
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE '%_history'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER no_update_%I
             BEFORE UPDATE OR DELETE ON %I
             FOR EACH ROW EXECUTE FUNCTION forbid_modifications();',
             tbl, tbl
        );
    END LOOP;
END $$;

