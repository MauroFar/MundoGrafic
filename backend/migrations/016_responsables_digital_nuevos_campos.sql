BEGIN;

ALTER TABLE detalle_orden_trabajo_digital
  ADD COLUMN IF NOT EXISTS preprensa_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS impresion_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS laminado_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS barnizado_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS troquelado_flexible_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS troquelado_plano_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS rebobinado_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS refilado_termoencogible_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS sellado_termoencogible_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS corte_termoencogible_responsable VARCHAR,
  ADD COLUMN IF NOT EXISTS terminado_responsable VARCHAR;

COMMIT;
