-- ============================================================================
-- MIGRACION 012: Agregar campos para gestión de envío y cancelación a producción
-- Fecha: 2026-04-28
-- Objetivo:
--   1) Permitir registrar observaciones al enviar a producción
--   2) Permitir registrar motivo de cancelación de producción
--   3) Mantener compatibilidad con datos existentes
-- ============================================================================

BEGIN;

ALTER TABLE orden_trabajo
  ADD COLUMN IF NOT EXISTS observacion_produccion TEXT,
  ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT;

COMMIT;
