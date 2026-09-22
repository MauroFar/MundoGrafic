BEGIN;

ALTER TABLE lista_pedidos
  DROP CONSTRAINT IF EXISTS ck_lista_pedidos_fase;

COMMIT;
