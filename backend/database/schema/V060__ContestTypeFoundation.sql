-- Migration V060: Contest Type Foundation
-- Safe to run repeatedly

CREATE TABLE IF NOT EXISTS contest_types (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_legs INTEGER NOT NULL,
  uses_thanksgiving_leg BOOLEAN DEFAULT FALSE,
  uses_christmas_leg BOOLEAN DEFAULT FALSE,
  uses_holiday_reservations BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed contest types if they don't exist
INSERT INTO contest_types (id, code, name, description, total_legs, uses_thanksgiving_leg, uses_christmas_leg, uses_holiday_reservations, is_active)
VALUES
  ('circa', 'CIRCA', 'Circa Survivor', '20-leg Survivor contest including Thanksgiving and Christmas holiday legs.', 20, TRUE, TRUE, TRUE, TRUE),
  ('standard', 'STANDARD', 'Standard Survivor', 'Traditional 18-week Survivor contest with no separate Thanksgiving or Christmas legs.', 18, FALSE, FALSE, FALSE, TRUE)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    total_legs = EXCLUDED.total_legs,
    uses_thanksgiving_leg = EXCLUDED.uses_thanksgiving_leg,
    uses_christmas_leg = EXCLUDED.uses_christmas_leg,
    uses_holiday_reservations = EXCLUDED.uses_holiday_reservations,
    is_active = EXCLUDED.is_active;

-- Add contest_type_id to survivor_entries
ALTER TABLE survivor_entries ADD COLUMN IF NOT EXISTS contest_type_id VARCHAR(50) REFERENCES contest_types(id) DEFAULT 'circa';

-- Update all existing entries to default to 'circa'
UPDATE survivor_entries SET contest_type_id = 'circa' WHERE contest_type_id IS NULL;

-- Enforce NOT NULL
ALTER TABLE survivor_entries ALTER COLUMN contest_type_id SET NOT NULL;
