-- ============================================================================
-- MIGRACION 013: Agregar estado cancelado a catálogos de órdenes
-- Fecha: 2026-04-28
-- Objetivo:
--   1) Permitir marcar órdenes como canceladas al cancelar producción
--   2) Mantener consistencia entre workflows offset y digital
-- ============================================================================

BEGIN;

INSERT INTO estado_orden_offset (key, titulo, orden, color, activo)
VALUES ('cancelado', 'Cancelado', 999, '#dc2626', TRUE)
ON CONFLICT (key) DO NOTHING;

INSERT INTO estado_orden_digital (key, titulo, orden, color, activo)
VALUES ('cancelado', 'Cancelado', 999, '#dc2626', TRUE)
ON CONFLICT (key) DO NOTHING;

COMMIT;
