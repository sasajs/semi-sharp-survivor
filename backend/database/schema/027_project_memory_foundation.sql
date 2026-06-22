-- Migration V027: Project Memory and System Metadata Foundation
-- Safe to run repeatedly (Idempotent)

CREATE TABLE IF NOT EXISTS system_metadata (
  id SERIAL PRIMARY KEY,
  system_name VARCHAR(255) NOT NULL,
  current_version VARCHAR(100) NOT NULL,
  current_git_branch VARCHAR(100) NOT NULL,
  current_git_tag VARCHAR(100) NOT NULL,
  deployment_environment VARCHAR(100) NOT NULL,
  server_hostname VARCHAR(255) NOT NULL,
  database_name VARCHAR(255) NOT NULL,
  last_startup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_versions (
  version_id SERIAL PRIMARY KEY,
  version_tag VARCHAR(100) NOT NULL UNIQUE,
  git_commit_hash VARCHAR(100) NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL,
  release_notes TEXT NOT NULL,
  milestone_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_decisions (
  decision_id SERIAL PRIMARY KEY,
  decision_date DATE NOT NULL,
  category VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  rationale TEXT NOT NULL,
  impact TEXT NOT NULL,
  status VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operations_events (
  event_id SERIAL PRIMARY KEY,
  event_type VARCHAR(150) NOT NULL,
  severity VARCHAR(100) NOT NULL,
  source VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  metadata_json TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seeding default Project Decisions if table is empty
INSERT INTO project_decisions (decision_date, category, title, rationale, impact, status)
SELECT '2026-06-20', 'Architectural Pattern', 'Repository Pattern Mandatory', 'Requires all tables and models to be decoupled via isolated class repositories.', 'Guarantees that database models can switch seamlessly between low-overhead mock in-memory states and postgres high-fidelity states.', 'APPROVED'
WHERE NOT EXISTS (SELECT 1 FROM project_decisions WHERE title = 'Repository Pattern Mandatory');

INSERT INTO project_decisions (decision_date, category, title, rationale, impact, status)
SELECT '2026-06-21', 'Persistence Strategy', 'PostgreSQL Authoritative Store', 'Adopt raw PostgreSQL relational engine for high-fidelity persistence tracking.', 'Secures and validates transaction logs, contest runs, system health metrics, and user logs with transactional durability.', 'APPROVED'
WHERE NOT EXISTS (SELECT 1 FROM project_decisions WHERE title = 'PostgreSQL Authoritative Store');

INSERT INTO project_decisions (decision_date, category, title, rationale, impact, status)
SELECT '2026-06-21', 'Aesthetic Rule', 'Mock Mode Retained', 'Retain full in-memory mock repositories and fallback controls for sandboxed testing.', 'Provides frictionless local development environment when running without an active PostgreSQL cluster link.', 'APPROVED'
WHERE NOT EXISTS (SELECT 1 FROM project_decisions WHERE title = 'Mock Mode Retained');

INSERT INTO project_decisions (decision_date, category, title, rationale, impact, status)
SELECT '2026-06-22', 'Environment Boundary', 'Cloudflare Deployment', 'Configure proxy tunnels and gateway firewalls to isolate system parameters.', 'Protects backoffice dashboards and JSON endpoints behind Cloudflare verification layer.', 'APPROVED'
WHERE NOT EXISTS (SELECT 1 FROM project_decisions WHERE title = 'Cloudflare Deployment');

INSERT INTO project_decisions (decision_date, category, title, rationale, impact, status)
SELECT '2026-06-22', 'Feature Strategy', 'Historical Replay Architecture', 'Model contest historical data with sub-second simulation replay features.', 'Allows testing modeling strategies across past season records with deep visual metric reviews.', 'APPROVED'
WHERE NOT EXISTS (SELECT 1 FROM project_decisions WHERE title = 'Historical Replay Architecture');

-- Seeding initial Application Versions if empty
INSERT INTO application_versions (version_tag, git_commit_hash, release_date, release_notes, milestone_name)
SELECT 'v0.26', 'a7b3c9e1f2d34567890abcdef1234567890abcde', '2026-06-21 12:00:00+00', 'Established raw system security roles and administrative gatekeeper rules.', 'Auth cutover'
WHERE NOT EXISTS (SELECT 1 FROM application_versions WHERE version_tag = 'v0.26');

INSERT INTO application_versions (version_tag, git_commit_hash, release_date, release_notes, milestone_name)
SELECT 'v0.27', '8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e', '2026-06-22 15:00:00+00', 'Upgraded platform to support persistent project memory, system metadata, and deep audits.', 'Project Memory Foundation'
WHERE NOT EXISTS (SELECT 1 FROM application_versions WHERE version_tag = 'v0.27');
