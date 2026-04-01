-- =============================================================================
-- MIGRACIÓN 001: Reestructuración de tablas de Orden de Trabajo
-- Fecha: 2026-03-25
-- Descripción:
--   - Agrega columnas faltantes a detalle_orden_trabajo_digital
--   - Migra datos desde detalle_orden_trabajo (tabla híbrida) hacia detalle_orden_trabajo_digital
--   - Migra responsables digitales desde orden_trabajo hacia detalle_orden_trabajo_digital
--   - Crea tabla productos_orden_offset (para N productos por orden offset)
--   - Elimina tabla híbrida detalle_orden_trabajo
--   - Elimina columnas de responsables y productos de orden_trabajo
--   - Crea catálogo estado_orden_offset + historial (igual que digital)
--   - Reemplaza campo estado (texto libre) por estado_orden_offset_id (FK al catálogo)
--
-- INSTRUCCIONES:
--   1. Ejecutar con ROLLBACK al final (ya configurado así por seguridad)
--   2. Revisar el SELECT de verificación del PASO 4
--   3. Si los datos son correctos, cambiar ROLLBACK por COMMIT y ejecutar de nuevo
--
-- CÓMO EJECUTAR:
--   psql -U tu_usuario -d tu_base_de_datos -f 001_reestructura_orden_trabajo.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- PASO 1: Agregar columnas faltantes en detalle_orden_trabajo_digital
--         Estos campos existen en detalle_orden_trabajo y necesitan migrar aquí
-- =============================================================================

-- Campos migrados desde detalle_orden_trabajo (tabla híbrida)
ALTER TABLE detalle_orden_trabajo_digital
  ADD COLUMN IF NOT EXISTS material                           TEXT,
  ADD COLUMN IF NOT EXISTS impresion                         VARCHAR,
  ADD COLUMN IF NOT EXISTS observaciones                     TEXT,
  ADD COLUMN IF NOT EXISTS numero_salida                     VARCHAR,
  -- Responsables del proceso digital
  ADD COLUMN IF NOT EXISTS vendedor                          VARCHAR,
  ADD COLUMN IF NOT EXISTS preprensa                         VARCHAR,
  ADD COLUMN IF NOT EXISTS prensa                            VARCHAR,
  ADD COLUMN IF NOT EXISTS laminado_barnizado                VARCHAR,
  ADD COLUMN IF NOT EXISTS troquelado                        VARCHAR,
  ADD COLUMN IF NOT EXISTS terminados                        VARCHAR,
  ADD COLUMN IF NOT EXISTS facturado                         VARCHAR,
  ADD COLUMN IF NOT EXISTS liberacion_producto               VARCHAR,
  -- Cantidades finales por responsable digital
  ADD COLUMN IF NOT EXISTS vendedor_cantidad_final           VARCHAR,
  ADD COLUMN IF NOT EXISTS preprensa_cantidad_final          VARCHAR,
  ADD COLUMN IF NOT EXISTS prensa_cantidad_final             VARCHAR,
  ADD COLUMN IF NOT EXISTS laminado_barnizado_cantidad_final  VARCHAR,
  ADD COLUMN IF NOT EXISTS troquelado_cantidad_final         VARCHAR,
  ADD COLUMN IF NOT EXISTS terminados_cantidad_final         VARCHAR,
  ADD COLUMN IF NOT EXISTS liberacion_producto_cantidad_final VARCHAR;

-- Responsables del proceso offset
ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS vendedor              VARCHAR,
  ADD COLUMN IF NOT EXISTS preprensa             VARCHAR,
  ADD COLUMN IF NOT EXISTS prensa                VARCHAR,
  ADD COLUMN IF NOT EXISTS terminados            VARCHAR,
  ADD COLUMN IF NOT EXISTS facturado             VARCHAR,
  -- Cantidades finales por responsable offset
  ADD COLUMN IF NOT EXISTS vendedor_cantidad_final   VARCHAR,
  ADD COLUMN IF NOT EXISTS preprensa_cantidad_final  VARCHAR,
  ADD COLUMN IF NOT EXISTS prensa_cantidad_final     VARCHAR,
  ADD COLUMN IF NOT EXISTS terminados_cantidad_final VARCHAR;

-- =============================================================================
-- PASO 2: Migrar datos desde detalle_orden_trabajo hacia detalle_orden_trabajo_digital
--         Solo actualizamos los registros que ya existen en detalle_orden_trabajo_digital
-- =============================================================================

UPDATE detalle_orden_trabajo_digital dtd
SET
  material      = dot.material,
  impresion     = dot.impresion,
  observaciones = dot.observaciones,
  numero_salida = dot.numero_salida
FROM detalle_orden_trabajo dot
WHERE dtd.orden_trabajo_id = dot.orden_trabajo_id;

-- =============================================================================
-- PASO 3: Migrar responsables y cantidades finales digitales desde orden_trabajo
--         hacia detalle_orden_trabajo_digital
-- =============================================================================

-- PASO 3a: Migrar responsables digitales desde orden_trabajo → detalle_orden_trabajo_digital
UPDATE detalle_orden_trabajo_digital dtd
SET
  vendedor                           = ot.vendedor,
  preprensa                          = ot.preprensa,
  prensa                             = ot.prensa,
  laminado_barnizado                 = ot.laminado_barnizado,
  troquelado                         = ot.troquelado,
  terminados                         = ot.terminados,
  facturado                          = ot.facturado,
  liberacion_producto                = ot.liberacion_producto,
  vendedor_cantidad_final            = ot.vendedor_cantidad_final,
  preprensa_cantidad_final           = ot.preprensa_cantidad_final,
  prensa_cantidad_final              = ot.prensa_cantidad_final,
  laminado_barnizado_cantidad_final  = ot.laminado_barnizado_cantidad_final,
  troquelado_cantidad_final          = ot.troquelado_cantidad_final,
  terminados_cantidad_final          = ot.terminados_cantidad_final,
  liberacion_producto_cantidad_final = ot.liberacion_producto_cantidad_final
FROM orden_trabajo ot
WHERE dtd.orden_trabajo_id = ot.id
  AND ot.tipo_orden = 'digital';

-- PASO 3b: Migrar responsables offset desde orden_trabajo → detalle_orden_trabajo_offset
--          (solo aplica para órdenes offset existentes, actualmente 0 registros en pruebas)
UPDATE detalle_orden_trabajo_offset dto
SET
  vendedor                 = ot.vendedor,
  preprensa                = ot.preprensa,
  prensa                   = ot.prensa,
  terminados               = ot.terminados,
  facturado                = ot.facturado,
  vendedor_cantidad_final  = ot.vendedor_cantidad_final,
  preprensa_cantidad_final = ot.preprensa_cantidad_final,
  prensa_cantidad_final    = ot.prensa_cantidad_final,
  terminados_cantidad_final = ot.terminados_cantidad_final
FROM orden_trabajo ot
WHERE dto.orden_trabajo_id = ot.id
  AND ot.tipo_orden = 'offset';

-- =============================================================================
-- PASO 4: VERIFICACIÓN
--         Revisar que todos los datos se copiaron correctamente antes de continuar.
--         Compara esta salida con los datos originales en orden_trabajo y
--         detalle_orden_trabajo. Si un campo aparece NULL y no debería, hay un problema.
-- =============================================================================

SELECT
  dtd.orden_trabajo_id,
  ot.numero_orden,
  dtd.material,
  dtd.impresion,
  dtd.observaciones,
  dtd.numero_salida,
  dtd.laminado_barnizado,
  dtd.troquelado,
  dtd.liberacion_producto
FROM detalle_orden_trabajo_digital dtd
JOIN orden_trabajo ot ON ot.id = dtd.orden_trabajo_id
ORDER BY dtd.orden_trabajo_id;

-- =============================================================================
-- PASO 5: Crear tabla productos_orden_offset
--         Permite que las órdenes offset tengan múltiples productos (1:N)
--         igual que ya existe para digital en productos_orden_digital
-- =============================================================================

CREATE TABLE IF NOT EXISTS productos_orden_offset (
  id               SERIAL PRIMARY KEY,
  orden_trabajo_id INTEGER NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  concepto         TEXT,
  cantidad         INTEGER,
  tamano_abierto   VARCHAR,
  tamano_cerrado   VARCHAR,
  material         TEXT,
  orden            INTEGER DEFAULT 1,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_orden_offset_orden_trabajo_id
  ON productos_orden_offset(orden_trabajo_id);

-- =============================================================================
-- PASO 6: Eliminar tabla híbrida detalle_orden_trabajo
--         Solo ejecutar si el PASO 4 confirmó que los datos están en
--         detalle_orden_trabajo_digital correctamente
-- =============================================================================

DROP TABLE IF EXISTS detalle_orden_trabajo;

-- =============================================================================
-- PASO 7: Eliminar columnas sobrantes de orden_trabajo
--         - Responsables exclusivos de digital (ya están en detalle_orden_trabajo_digital)
--         - concepto y cantidad (vivirán en productos_orden_offset / productos_orden_digital)
-- =============================================================================

ALTER TABLE orden_trabajo
  -- Responsables (van a sus tablas de detalle por tipo de orden)
  DROP COLUMN IF EXISTS vendedor,
  DROP COLUMN IF EXISTS preprensa,
  DROP COLUMN IF EXISTS prensa,
  DROP COLUMN IF EXISTS terminados,
  DROP COLUMN IF EXISTS facturado,
  -- Responsables exclusivos digital (ya en detalle_orden_trabajo_digital)
  DROP COLUMN IF EXISTS laminado_barnizado,
  DROP COLUMN IF EXISTS troquelado,
  DROP COLUMN IF EXISTS liberacion_producto,
  -- Cantidades finales (ya en sus tablas de detalle)
  DROP COLUMN IF EXISTS vendedor_cantidad_final,
  DROP COLUMN IF EXISTS preprensa_cantidad_final,
  DROP COLUMN IF EXISTS prensa_cantidad_final,
  DROP COLUMN IF EXISTS laminado_barnizado_cantidad_final,
  DROP COLUMN IF EXISTS troquelado_cantidad_final,
  DROP COLUMN IF EXISTS terminados_cantidad_final,
  DROP COLUMN IF EXISTS liberacion_producto_cantidad_final,
  -- Producto/cantidad (viven en productos_orden_offset / productos_orden_digital)
  DROP COLUMN IF EXISTS concepto,
  DROP COLUMN IF EXISTS cantidad;

-- =============================================================================
-- PASO 8: Crear catálogo de estados para órdenes OFFSET
--         Misma estructura que estado_orden_digital para consistencia
-- =============================================================================

CREATE TABLE IF NOT EXISTS estado_orden_offset (
  id     SERIAL PRIMARY KEY,
  key    VARCHAR NOT NULL UNIQUE,
  titulo VARCHAR NOT NULL,
  orden  INTEGER DEFAULT 0,
  color  VARCHAR DEFAULT '#6b7280',
  activo BOOLEAN DEFAULT TRUE
);

INSERT INTO estado_orden_offset (key, titulo, orden, color) VALUES
  ('pendiente',    'Pendiente',    1, '#6b7280'),
  ('en_preprensa', 'En Preprensa', 2, '#3b82f6'),
  ('en_prensa',    'En Prensa',    3, '#eab308'),
  ('terminados',   'Terminados',   4, '#f97316'),
  ('facturado',    'Facturado',    5, '#8b5cf6'),
  ('entregado',    'Entregado',    6, '#22c55e')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- PASO 9: Crear historial de cambios de estado para órdenes OFFSET
--         Misma estructura que estado_orden_digital_historial
-- =============================================================================

CREATE TABLE IF NOT EXISTS estado_orden_offset_historial (
  id               SERIAL PRIMARY KEY,
  orden_trabajo_id INTEGER NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  estado_id        INTEGER NOT NULL REFERENCES estado_orden_offset(id),
  usuario_id       INTEGER,
  nota             TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estado_offset_historial_orden
  ON estado_orden_offset_historial(orden_trabajo_id);

-- =============================================================================
-- PASO 10: Reemplazar campo estado (texto libre) en orden_trabajo
--          por estado_orden_offset_id (FK al catálogo) igual que digital
-- =============================================================================

-- Agregar nueva columna FK
ALTER TABLE orden_trabajo
  ADD COLUMN IF NOT EXISTS estado_orden_offset_id INTEGER REFERENCES estado_orden_offset(id);

-- Migrar valores actuales del campo texto estado → FK al catálogo
-- Mapea los valores de texto existentes al id correspondiente en estado_orden_offset
UPDATE orden_trabajo ot
SET estado_orden_offset_id = eoo.id
FROM estado_orden_offset eoo
WHERE ot.tipo_orden = 'offset'
  AND (
    LOWER(TRIM(ot.estado)) = eoo.key
    OR (LOWER(TRIM(ot.estado)) IN ('pendiente','') AND eoo.key = 'pendiente')
  );

-- Las órdenes offset sin estado reconocido quedan en 'pendiente' por defecto
UPDATE orden_trabajo
SET estado_orden_offset_id = (SELECT id FROM estado_orden_offset WHERE key = 'pendiente')
WHERE tipo_orden = 'offset'
  AND estado_orden_offset_id IS NULL;

-- Eliminar el campo texto estado (ya no se usa en ningún tipo de orden)
ALTER TABLE orden_trabajo
  DROP COLUMN IF EXISTS estado;

-- =============================================================================
-- ⚠️  IMPORTANTE: Este script termina en ROLLBACK por seguridad.
--
--  → Revisa la salida del SELECT del PASO 4.
--  → Si todos los datos están correctos, cambia ROLLBACK por COMMIT abajo
--    y ejecuta el script nuevamente.
-- =============================================================================

-- ROLLBACK;
COMMIT; -- ← Migración confirmada y ejecutada el 2026-03-25
