-- MIGRACION 024: Agregar columna fecha_aprobacion a lista_pedidos
-- Objetivo:
--   Registrar la fecha en que un pedido fue aprobado.
--   Campo opcional (NULL), ubicado conceptualmente junto a fecha_ingreso_pedido.

BEGIN;

ALTER TABLE lista_pedidos
  ADD COLUMN IF NOT EXISTS fecha_aprobacion DATE NULL;

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_fecha_aprobacion
  ON lista_pedidos (fecha_aprobacion);

COMMIT;
