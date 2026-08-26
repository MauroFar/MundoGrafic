-- =============================================================================
-- MIGRACIÓN 025: Columna info_tecnica (JSONB) en productos_orden_digital
-- Fecha: 2026-08-26
-- Descripción:
--   Agrega la columna info_tecnica (JSONB nullable) a productos_orden_digital.
--   Permite almacenar información técnica específica para un producto individual
--   (adherencia, material, troquel, etc.) de forma independiente al cuadro
--   general que vive en detalle_orden_trabajo_digital.
--   Cuando el usuario genera una "Información Técnica específica" para un
--   producto desde la UI, ese objeto se serializa aquí. NULL indica que el
--   producto hereda la información técnica general de la orden.
-- =============================================================================

BEGIN;

ALTER TABLE productos_orden_digital
  ADD COLUMN IF NOT EXISTS info_tecnica JSONB NULL;

COMMIT;
