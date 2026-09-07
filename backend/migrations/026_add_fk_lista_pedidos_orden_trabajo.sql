-- MIGRACIÓN 026: Relación real entre lista_pedidos y orden_trabajo
-- Objetivo:
--   1) Enlazar un pedido con la OT creada.
--   2) Actualizar no_op automáticamente desde el número de la OT.
--   3) Dejar la relación como FK real, no sólo como campo libre.

BEGIN;

ALTER TABLE lista_pedidos
  ADD COLUMN IF NOT EXISTS orden_trabajo_id BIGINT NULL;

UPDATE lista_pedidos lp
SET no_op = ot.numero_orden
FROM orden_trabajo ot
WHERE lp.orden_trabajo_id = ot.id
  AND lp.orden_trabajo_id IS NOT NULL
  AND (lp.no_op IS NULL OR lp.no_op = '');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_lista_pedidos_orden_trabajo'
  ) THEN
    ALTER TABLE lista_pedidos
      ADD CONSTRAINT fk_lista_pedidos_orden_trabajo
      FOREIGN KEY (orden_trabajo_id)
      REFERENCES orden_trabajo(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_orden_trabajo_id
  ON lista_pedidos (orden_trabajo_id);

COMMIT;
