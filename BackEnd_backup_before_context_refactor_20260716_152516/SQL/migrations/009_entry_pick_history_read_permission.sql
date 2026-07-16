BEGIN;

GRANT USAGE
ON SCHEMA survivor
TO semisharp_app;

GRANT SELECT
ON TABLE survivor.entry_pick_history
TO semisharp_app;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE survivor.entry_pick_history
FROM semisharp_app;

REVOKE USAGE, UPDATE
ON SEQUENCE
    survivor.entry_pick_history_entry_pick_history_id_seq
FROM semisharp_app;

COMMIT;
