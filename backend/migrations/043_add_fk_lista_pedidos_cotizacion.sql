-- MIGRACIÓN 043: Relación real entre lista_pedidos y cotizaciones
-- Objetivo:
--   1) Enlazar cada pedido con la cotización origen.
--   2) Evitar filas huérfanas con cotizacion_id inválido.
--   3) Dejar la relación como FK real, no sólo como campo libre.

BEGIN;

UPDATE lista_pedidos lp
SET cotizacion_id = NULL
WHERE lp.cotizacion_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM cotizaciones c
    WHERE c.id = lp.cotizacion_id
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_lista_pedidos_cotizacion'
  ) THEN
    ALTER TABLE lista_pedidos
      ADD CONSTRAINT fk_lista_pedidos_cotizacion
      FOREIGN KEY (cotizacion_id)
      REFERENCES cotizaciones(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_cotizacion_id
  ON lista_pedidos (cotizacion_id);

COMMIT;
