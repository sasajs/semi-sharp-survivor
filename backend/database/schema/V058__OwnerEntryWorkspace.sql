-- Migration V058: Owner Entry Workspace Tables
-- Safe to run repeatedly

CREATE TABLE IF NOT EXISTS owners (
  id VARCHAR(50) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  owner_type VARCHAR(50) NOT NULL, -- 'individual' or 'group'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check and add owner_id column to survivor_entries if it doesn't already exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='survivor_entries' AND column_name='owner_id'
  ) THEN
    ALTER TABLE survivor_entries ADD COLUMN owner_id VARCHAR(50) REFERENCES owners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Seed initial owners
INSERT INTO owners (id, display_name, email, owner_type, active)
VALUES 
  ('owner-steve', 'Steve', 'Steve.Schilhabel@gmail.com', 'individual', TRUE),
  ('owner-cameron', 'Cameron', 'cameron@example.com', 'individual', TRUE),
  ('owner-uw-oshkosh', 'UW Oshkosh Group', 'uwosh@example.com', 'group', TRUE)
ON CONFLICT (id) DO UPDATE 
SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, owner_type = EXCLUDED.owner_type, active = EXCLUDED.active;

-- Update existing survivor_entries to connect to owners
UPDATE survivor_entries SET owner_id = 'owner-steve' WHERE id IN ('UWOSH-1', 'UWOSH-2');
UPDATE survivor_entries SET owner_id = 'owner-cameron' WHERE id = 'UWOSH-3';
UPDATE survivor_entries SET owner_id = 'owner-uw-oshkosh' WHERE id = 'UWOSH-4';

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_survivor_entries_owner_id ON survivor_entries(owner_id);
