BEGIN;

-- ============================================================
-- SemiSharp In-Season Survivor Pick Management
--
-- Adds:
--   1. update/audit fields to survivor.entry_picks
--   2. controlled source and status values
--   3. immutable history for insert/update/delete operations
--
-- Existing protections retained:
--   UNIQUE (entry_id, contest_leg_id)
--   UNIQUE (entry_id, team_id)
-- ============================================================


-- ------------------------------------------------------------
-- Current pick record audit fields
-- ------------------------------------------------------------

ALTER TABLE survivor.entry_picks
    ADD COLUMN IF NOT EXISTS pick_status text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS updated_by_user_id integer,
    ADD COLUMN IF NOT EXISTS change_reason text;


UPDATE survivor.entry_picks
SET
    pick_status = COALESCE(
        pick_status,
        'CONFIRMED'
    ),
    updated_at = COALESCE(
        updated_at,
        created_at,
        now()
    );


ALTER TABLE survivor.entry_picks
    ALTER COLUMN pick_status
        SET DEFAULT 'CONFIRMED',
    ALTER COLUMN pick_status
        SET NOT NULL,
    ALTER COLUMN updated_at
        SET DEFAULT now(),
    ALTER COLUMN updated_at
        SET NOT NULL;


-- ------------------------------------------------------------
-- Normalize the existing source default
-- ------------------------------------------------------------

ALTER TABLE survivor.entry_picks
    ALTER COLUMN pick_source
        SET DEFAULT 'USER_ENTRY';


-- ------------------------------------------------------------
-- Foreign key for the user making a correction
--
-- Nullable because system imports and historical migrations may
-- not correspond to one authenticated user.
-- ------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'entry_picks_updated_by_user_id_fkey'
          AND conrelid =
            'survivor.entry_picks'::regclass
    ) THEN
        ALTER TABLE survivor.entry_picks
            ADD CONSTRAINT
                entry_picks_updated_by_user_id_fkey
            FOREIGN KEY (updated_by_user_id)
            REFERENCES auth.users(user_id);
    END IF;
END
$$;


-- ------------------------------------------------------------
-- Controlled values
-- ------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'entry_picks_pick_status_check'
          AND conrelid =
            'survivor.entry_picks'::regclass
    ) THEN
        ALTER TABLE survivor.entry_picks
            ADD CONSTRAINT
                entry_picks_pick_status_check
            CHECK (
                pick_status IN (
                    'CONFIRMED',
                    'PENDING',
                    'VOID'
                )
            );
    END IF;
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'entry_picks_pick_source_check'
          AND conrelid =
            'survivor.entry_picks'::regclass
    ) THEN
        ALTER TABLE survivor.entry_picks
            ADD CONSTRAINT
                entry_picks_pick_source_check
            CHECK (
                pick_source IN (
                    'USER',
                    'USER_ENTRY',
                    'SYSTEM_IMPORT',
                    'ADMIN_CORRECTION',
                    'HISTORICAL_IMPORT'
                )
            );
    END IF;
END
$$;


-- ------------------------------------------------------------
-- Immutable pick history
--
-- This table is append-only. Corrections to survivor.entry_picks
-- never erase the historical record of what changed.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS survivor.entry_pick_history (
    entry_pick_history_id bigserial PRIMARY KEY,

    entry_pick_id integer,
    entry_id integer NOT NULL,
    contest_leg_id integer NOT NULL,
    team_id integer NOT NULL,

    operation text NOT NULL,
    pick_source text NOT NULL,
    pick_status text NOT NULL,

    picked_at timestamptz,
    notes text,
    change_reason text,
    changed_by_user_id integer,

    old_record jsonb,
    new_record jsonb,

    changed_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT entry_pick_history_operation_check
        CHECK (
            operation IN (
                'INSERT',
                'UPDATE',
                'DELETE'
            )
        ),

    CONSTRAINT entry_pick_history_entry_id_fkey
        FOREIGN KEY (entry_id)
        REFERENCES survivor.entries(entry_id),

    CONSTRAINT entry_pick_history_contest_leg_id_fkey
        FOREIGN KEY (contest_leg_id)
        REFERENCES contest.legs(contest_leg_id),

    CONSTRAINT entry_pick_history_team_id_fkey
        FOREIGN KEY (team_id)
        REFERENCES reference.teams(team_id),

    CONSTRAINT entry_pick_history_changed_by_user_id_fkey
        FOREIGN KEY (changed_by_user_id)
        REFERENCES auth.users(user_id)
);


CREATE INDEX IF NOT EXISTS
    idx_entry_pick_history_entry
ON survivor.entry_pick_history (
    entry_id,
    changed_at DESC
);


CREATE INDEX IF NOT EXISTS
    idx_entry_pick_history_leg
ON survivor.entry_pick_history (
    contest_leg_id,
    changed_at DESC
);


-- ------------------------------------------------------------
-- Immutable audit trigger
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION
    survivor.audit_entry_pick_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    audit_entry_pick_id integer;
    audit_entry_id integer;
    audit_contest_leg_id integer;
    audit_team_id integer;
    audit_pick_source text;
    audit_pick_status text;
    audit_picked_at timestamptz;
    audit_notes text;
    audit_change_reason text;
    audit_changed_by_user_id integer;
BEGIN
    IF TG_OP = 'DELETE' THEN
        audit_entry_pick_id :=
            OLD.entry_pick_id;
        audit_entry_id :=
            OLD.entry_id;
        audit_contest_leg_id :=
            OLD.contest_leg_id;
        audit_team_id :=
            OLD.team_id;
        audit_pick_source :=
            OLD.pick_source;
        audit_pick_status :=
            OLD.pick_status;
        audit_picked_at :=
            OLD.picked_at;
        audit_notes :=
            OLD.notes;
        audit_change_reason :=
            OLD.change_reason;
        audit_changed_by_user_id :=
            OLD.updated_by_user_id;

    ELSE
        audit_entry_pick_id :=
            NEW.entry_pick_id;
        audit_entry_id :=
            NEW.entry_id;
        audit_contest_leg_id :=
            NEW.contest_leg_id;
        audit_team_id :=
            NEW.team_id;
        audit_pick_source :=
            NEW.pick_source;
        audit_pick_status :=
            NEW.pick_status;
        audit_picked_at :=
            NEW.picked_at;
        audit_notes :=
            NEW.notes;
        audit_change_reason :=
            NEW.change_reason;
        audit_changed_by_user_id :=
            NEW.updated_by_user_id;
    END IF;


    INSERT INTO survivor.entry_pick_history (
        entry_pick_id,
        entry_id,
        contest_leg_id,
        team_id,
        operation,
        pick_source,
        pick_status,
        picked_at,
        notes,
        change_reason,
        changed_by_user_id,
        old_record,
        new_record,
        changed_at
    )
    VALUES (
        audit_entry_pick_id,
        audit_entry_id,
        audit_contest_leg_id,
        audit_team_id,
        TG_OP,
        audit_pick_source,
        audit_pick_status,
        audit_picked_at,
        audit_notes,
        audit_change_reason,
        audit_changed_by_user_id,
        CASE
            WHEN TG_OP IN ('UPDATE', 'DELETE')
                THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE')
                THEN to_jsonb(NEW)
            ELSE NULL
        END,
        now()
    );


    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END
$$;


DROP TRIGGER IF EXISTS
    trg_audit_entry_pick_change
ON survivor.entry_picks;


CREATE TRIGGER trg_audit_entry_pick_change
AFTER INSERT OR UPDATE OR DELETE
ON survivor.entry_picks
FOR EACH ROW
EXECUTE FUNCTION
    survivor.audit_entry_pick_change();


COMMIT;
