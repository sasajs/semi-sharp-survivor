-- Version 5.3 test-data correction
-- Entry 1 is a Circa Survivor entry.
-- Its historical Week 1 pick incorrectly referenced the Standard
-- Survivor Week 1 contest leg.

UPDATE survivor.entry_picks
SET
    contest_leg_id = 19,
    updated_at = now(),
    change_reason = (
        'Corrected historical test data to match entry contest format'
    )
WHERE entry_pick_id = 18
  AND entry_id = 1
  AND contest_leg_id = 1;
