-- Migration V059: Role-Based Owner Access
-- Safe to run repeatedly

CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'user', 'group_representative'
  owner_id VARCHAR(50) REFERENCES owners(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_owner_id ON app_users(owner_id);

-- Seed users: admin, steve, cameron, group.
-- Use string IDs: user-admin, user-steve, user-cameron, user-group.
-- Passwords are set to match their username (hashed with SHA-256 for secure comparison):
-- 'admin':   8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
-- 'steve':   a09033324f9f69424c8322e70e9a037803d3bc93c04c554a9d949ecf14652c70
-- 'cameron': 199990b797968561ec9c7929497e201200257e852445b9db054e8be48e9d6d7e
-- 'group':   a0bc9568ec3b7b6863118a1bf18dbfb37e2962451557999738ef9ca8c903a4cf

INSERT INTO app_users (id, username, password_hash, display_name, role, owner_id, active)
VALUES
  ('user-admin', 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Admin User', 'admin', NULL, TRUE),
  ('user-steve', 'steve', 'a09033324f9f69424c8322e70e9a037803d3bc93c04c554a9d949ecf14652c70', 'Steve Schilhabel', 'user', 'owner-steve', TRUE),
  ('user-cameron', 'cameron', '199990b797968561ec9c7929497e201200257e852445b9db054e8be48e9d6d7e', 'Cameron', 'user', 'owner-cameron', TRUE),
  ('user-group', 'group', 'a0bc9568ec3b7b6863118a1bf18dbfb37e2962451557999738ef9ca8c903a4cf', 'UW Oshkosh Group', 'group_representative', 'owner-uw-oshkosh', TRUE)
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    owner_id = EXCLUDED.owner_id,
    active = EXCLUDED.active;
