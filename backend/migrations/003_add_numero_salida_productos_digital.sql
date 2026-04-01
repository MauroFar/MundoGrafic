-- =============================================================================
-- MIGRACIÓN 003: Agregar numero_salida por producto en productos_orden_digital
-- Fecha: 2026-03-25
-- Descripción:
--   - Agrega columna numero_salida a productos_orden_digital
--     (anteriormente era un campo único en detalle_orden_trabajo_digital)
--   - La columna avance se MANTIENE en productos_orden_digital (no se elimina)
--   - La columna numero_salida en detalle_orden_trabajo_digital se MANTIENE
--     por compatibilidad con registros históricos (no se elimina)
--
-- INSTRUCCIONES:
--   1. Ejecutar en pgAdmin o con psql apuntando a la base de datos de producción
--   2. El script es seguro de ejecutar: usa ADD COLUMN IF NOT EXISTS
-- =============================================================================

BEGIN;

-- ===========================================================================
-- PASO 1: Agregar numero_salida a cada producto digital
--         Cada producto tendrá su propio número de salida (1, 2, 3 o 4)
-- ===========================================================================

ALTER TABLE productos_orden_digital
  ADD COLUMN IF NOT EXISTS numero_salida VARCHAR;

-- ===========================================================================
-- PASO 2 (Opcional): Migrar el valor compartido al primer producto existente
--   Si ya existían órdenes con numero_salida en detalle_orden_trabajo_digital,
--   copiamos ese valor al primer producto de cada orden como punto de partida.
-- ===========================================================================

UPDATE productos_orden_digital pod
SET numero_salida = d.numero_salida
FROM detalle_orden_trabajo_digital d
WHERE pod.orden_trabajo_id = d.orden_trabajo_id
  AND pod.orden = 1
  AND d.numero_salida IS NOT NULL
  AND pod.numero_salida IS NULL;

-- ===========================================================================
-- VERIFICACIÓN
-- ===========================================================================

SELECT
  pod.orden_trabajo_id,
  pod.orden,
  pod.producto,
  pod.avance,
  pod.numero_salida
FROM productos_orden_digital pod
ORDER BY pod.orden_trabajo_id, pod.orden
LIMIT 20;

COMMIT;
