CREATE TABLE IF NOT EXISTS recommendation_evolution (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  contest_id INT,
  recommendation_id INT,
  team_id VARCHAR(50),
  previous_rank INT,
  new_rank INT,
  previous_confidence DECIMAL(10,6),
  new_confidence DECIMAL(10,6),
  previous_probability DECIMAL(10,6),
  new_probability DECIMAL(10,6),
  previous_expected_value DECIMAL(10,6),
  new_expected_value DECIMAL(10,6),
  previous_model_weight DECIMAL(10,6),
  new_model_weight DECIMAL(10,6),
  evolution_reason TEXT NOT NULL,
  triggering_event VARCHAR(100) NOT NULL,
  recommendation_status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_change_events (
  id SERIAL PRIMARY KEY,
  recommendation_id INT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_source VARCHAR(100) NOT NULL,
  event_description TEXT NOT NULL,
  impact_score DECIMAL(5,2) NOT NULL,
  previous_value VARCHAR(255),
  new_value VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_evolution_summary (
  id SERIAL PRIMARY KEY,
  season VARCHAR(10) NOT NULL,
  week INT NOT NULL,
  total_changes INT NOT NULL,
  major_changes INT NOT NULL,
  stable_recommendations INT NOT NULL,
  average_confidence_delta DECIMAL(10,6) NOT NULL,
  average_rank_delta DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
