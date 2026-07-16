-- Create analytics.game_probabilities table
CREATE TABLE analytics.game_probabilities (
    game_id TEXT NOT NULL,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    baseline_win_prob NUMERIC(5, 4) NOT NULL,
    risk_adjusted_win_prob NUMERIC(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id)
);

-- Add index for efficient lookups by strategy engine
CREATE INDEX idx_game_probs_season_week ON analytics.game_probabilities(season, week);
