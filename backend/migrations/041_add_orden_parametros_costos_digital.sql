BEGIN;

ALTER TABLE materiales_digitales
  ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 9999;

ALTER TABLE procesos_digitales
  ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 9999;

ALTER TABLE costos_operativos_digitales
  ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 9999;

CREATE INDEX IF NOT EXISTS idx_materiales_digitales_orden
  ON materiales_digitales (orden, nombre);

CREATE INDEX IF NOT EXISTS idx_procesos_digitales_orden
  ON procesos_digitales (orden, nombre);

CREATE INDEX IF NOT EXISTS idx_costos_operativos_digitales_orden
  ON costos_operativos_digitales (orden, concepto);

COMMIT;
