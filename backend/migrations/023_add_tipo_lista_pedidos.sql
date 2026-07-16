-- MIGRACION 023: Agregar columna tipo a lista_pedidos
-- Objetivo:
--   Permitir separar los pedidos en dos categorías: 'offset' y 'digital'.
--   Default 'offset' para mantener compatibilidad con registros existentes.

BEGIN;

ALTER TABLE lista_pedidos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'offset';

ALTER TABLE lista_pedidos
  ADD CONSTRAINT ck_lista_pedidos_tipo
    CHECK (tipo IN ('offset', 'digital'));

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_tipo
  ON lista_pedidos (tipo);

COMMIT;
