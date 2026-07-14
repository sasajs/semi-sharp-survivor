BEGIN;

ALTER TABLE system.application_context
    ADD COLUMN IF NOT EXISTS risk_model text,
    ADD COLUMN IF NOT EXISTS probability_model text;

UPDATE system.application_context
SET
    risk_model = COALESCE(risk_model, 'SEMISHARP_RISK_V3'),
    probability_model = COALESCE(probability_model, 'SEMISHARP_WP_V2')
WHERE is_active = TRUE;

ALTER TABLE system.application_context
    ALTER COLUMN risk_model SET NOT NULL,
    ALTER COLUMN probability_model SET NOT NULL;

COMMIT;
