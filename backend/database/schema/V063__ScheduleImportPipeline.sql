-- V063__ScheduleImportPipeline.sql
-- Ingestion pipeline schema tracking tables

-- 1. Safely remove any check constraints on 'status' in import_jobs to allow more statuses (e.g. 'dry_run')
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'import_jobs'
          AND con.contype = 'c'
          AND conname LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE import_jobs DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. Expand import_jobs with new tracking metrics and identity references
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS provider VARCHAR(100);
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS rows_read INTEGER DEFAULT 0;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS rows_inserted INTEGER DEFAULT 0;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS rows_updated INTEGER DEFAULT 0;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS rows_rejected INTEGER DEFAULT 0;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(100) DEFAULT 'admin';

-- Re-apply a broader check constraint for status
ALTER TABLE import_jobs ADD CONSTRAINT import_jobs_status_check CHECK (status IN ('pending', 'dry_run', 'completed', 'failed'));

-- 3. Create Import Job Files Table for tracing uploaded sources
CREATE TABLE IF NOT EXISTS import_job_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Import Job Errors Table for capturing ingestion telemetry
CREATE TABLE IF NOT EXISTS import_job_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_index INTEGER,
    raw_data TEXT,
    error_message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'error' CHECK (severity IN ('warning', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
