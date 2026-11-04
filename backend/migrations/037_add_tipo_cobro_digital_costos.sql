-- =============================================================================
-- MIGRACIÓN 037: agrega tipo_cobro a materiales y costos operativos digitales
-- Fecha: 2026-11-04
-- Descripción:
--   Mantiene consistencia con procesos_digitales y valida en base de datos que
--   solo se acepten los valores definidos por la UI del cotizador digital
-- =============================================================================

BEGIN;

ALTER TABLE materiales_digitales
    ADD COLUMN IF NOT EXISTS tipo_cobro VARCHAR(20);

UPDATE materiales_digitales
SET tipo_cobro = 'metro'
WHERE tipo_cobro IS NULL;

ALTER TABLE materiales_digitales
    ALTER COLUMN tipo_cobro SET DEFAULT 'metro';

ALTER TABLE materiales_digitales
    ALTER COLUMN tipo_cobro SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'materiales_digitales_tipo_cobro_check'
    ) THEN
        ALTER TABLE materiales_digitales
            ADD CONSTRAINT materiales_digitales_tipo_cobro_check
            CHECK (tipo_cobro IN ('metro', 'fijo', 'millar'));
    END IF;
END $$;

ALTER TABLE costos_operativos_digitales
    ADD COLUMN IF NOT EXISTS tipo_cobro VARCHAR(20);

UPDATE costos_operativos_digitales
SET tipo_cobro = 'metro'
WHERE tipo_cobro IS NULL;

ALTER TABLE costos_operativos_digitales
    ALTER COLUMN tipo_cobro SET DEFAULT 'metro';

ALTER TABLE costos_operativos_digitales
    ALTER COLUMN tipo_cobro SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'costos_operativos_digitales_tipo_cobro_check'
    ) THEN
        ALTER TABLE costos_operativos_digitales
            ADD CONSTRAINT costos_operativos_digitales_tipo_cobro_check
            CHECK (tipo_cobro IN ('metro', 'fijo', 'millar'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_materiales_digitales_tipo_cobro
    ON materiales_digitales (tipo_cobro);

CREATE INDEX IF NOT EXISTS idx_costos_operativos_digitales_tipo_cobro
    ON costos_operativos_digitales (tipo_cobro);

COMMIT;
