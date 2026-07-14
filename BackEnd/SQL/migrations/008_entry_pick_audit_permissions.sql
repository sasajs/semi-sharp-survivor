BEGIN;

-- ============================================================
-- Entry Pick Audit Permissions
--
-- The application may create/update/delete current official picks.
-- The audit trigger writes immutable history using the function
-- owner's privileges.
--
-- The application itself does not receive direct INSERT, UPDATE,
-- or DELETE access to survivor.entry_pick_history.
-- ============================================================


-- Run the trigger with the function owner's permissions.
ALTER FUNCTION survivor.audit_entry_pick_change()
    SECURITY DEFINER;


-- Prevent object-shadowing attacks inside a SECURITY DEFINER function.
ALTER FUNCTION survivor.audit_entry_pick_change()
    SET search_path = pg_catalog, survivor;


-- Remove accidental public access.
REVOKE ALL
ON TABLE survivor.entry_pick_history
FROM PUBLIC;


REVOKE ALL
ON SEQUENCE
    survivor.entry_pick_history_entry_pick_history_id_seq
FROM PUBLIC;


-- Current-pick writes remain controlled through survivor.entry_picks.
-- The trigger function owns the history insert.
COMMIT;
