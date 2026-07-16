ALTER TABLE jobs.job_queue
ADD COLUMN IF NOT EXISTS worker_id text;

ALTER TABLE jobs.job_queue
ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0;

ALTER TABLE jobs.job_queue
ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

ALTER TABLE jobs.job_queue
ALTER COLUMN job_status SET DEFAULT 'queued';
