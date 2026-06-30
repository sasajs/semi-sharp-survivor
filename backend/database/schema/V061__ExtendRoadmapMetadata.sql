-- Migration V061: Extend Roadmap Metadata with Contest Type information
-- Safe to run repeatedly

ALTER TABLE survivor_entry_roadmaps ADD COLUMN IF NOT EXISTS contest_type_id VARCHAR(50);
ALTER TABLE survivor_entry_roadmaps ADD COLUMN IF NOT EXISTS total_legs INT;
ALTER TABLE survivor_entry_roadmaps ADD COLUMN IF NOT EXISTS holiday_enabled BOOLEAN DEFAULT FALSE;
