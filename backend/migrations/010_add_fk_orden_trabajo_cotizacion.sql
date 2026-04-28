-- ============================================================================
-- MIGRACION 010: Asegurar integridad entre orden_trabajo e id_cotizacion
-- Fecha: 2026-04-28
-- Objetivo:
--   1) Limpiar referencias huerfanas en orden_trabajo.id_cotizacion
--   2) Agregar FK hacia cotizaciones(id) sin afectar cotizaciones existentes
--   3) Mejorar performance de joins con indice
-- ============================================================================

BEGIN;

-- 1) Normalizar referencias huerfanas: si la cotizacion no existe, dejar NULL
UPDATE orden_trabajo ot
SET id_cotizacion = NULL
WHERE ot.id_cotizacion IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cotizaciones c
    WHERE c.id = ot.id_cotizacion
  );

-- 2) Indice para consultas y joins por cotizacion
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_id_cotizacion
  ON orden_trabajo(id_cotizacion);

-- 3) Agregar FK de forma idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orden_trabajo_id_cotizacion_fkey'
  ) THEN
    ALTER TABLE orden_trabajo
      ADD CONSTRAINT orden_trabajo_id_cotizacion_fkey
      FOREIGN KEY (id_cotizacion)
      REFERENCES cotizaciones(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
