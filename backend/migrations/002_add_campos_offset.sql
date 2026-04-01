-- ============================================================
-- MIGRACIÓN 002: Agregar campos faltantes a detalle_orden_trabajo_offset
-- Añade: material, impresion, observaciones, numero_salida
-- (campos que estaban en la tabla detalle_orden_trabajo común y
--  solo se movieron a detalle_orden_trabajo_digital en la migración 001)
-- ============================================================

BEGIN;

ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS material       TEXT,
  ADD COLUMN IF NOT EXISTS impresion      TEXT,
  ADD COLUMN IF NOT EXISTS observaciones  TEXT,
  ADD COLUMN IF NOT EXISTS numero_salida  TEXT;

COMMIT;
