-- =============================================================================
-- MIGRACIÓN 007: Columna trazabilidad_proceso (JSONB) en tablas de detalle
-- Fecha: 2026-04-07
-- Descripción:
--   Agrega la columna trazabilidad_proceso (JSONB nullable) a
--   detalle_orden_trabajo_digital y detalle_orden_trabajo_offset.
--   El backend la usa como almacenamiento complementario al enfoque
--   relacional de la migración 005.
-- =============================================================================

BEGIN;

ALTER TABLE detalle_orden_trabajo_digital
  ADD COLUMN IF NOT EXISTS trazabilidad_proceso JSONB NULL;

ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS trazabilidad_proceso JSONB NULL;

COMMIT;
