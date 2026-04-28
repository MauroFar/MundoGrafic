-- ============================================================================
-- MIGRACION 011: Agregar observación opcional para aprobación de cotizaciones
-- Fecha: 2026-04-28
-- Objetivo:
--   1) Permitir registrar observaciones al aprobar una cotización
--   2) Mantener compatibilidad con datos existentes
-- ============================================================================

BEGIN;

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS observacion_aprobacion TEXT;

COMMIT;
