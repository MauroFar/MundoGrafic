-- MIGRACION 018: Registro Operario manual (tabla independiente)
-- Requisito: sin relaciones ni llaves foraneas con otras tablas del sistema.

CREATE TABLE IF NOT EXISTS registros_operario (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  operario VARCHAR(150) NOT NULL,
  codigo_operario VARCHAR(50) NOT NULL,
  cliente VARCHAR(180) NOT NULL,
  orden_compra VARCHAR(80) NOT NULL,
  lote VARCHAR(80) NOT NULL,
  producto VARCHAR(500) NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad >= 100),
  millares INTEGER NOT NULL CHECK (millares >= 0),
  maquina VARCHAR(80) NOT NULL,
  actividad VARCHAR(120) NOT NULL,
  tiempo_efectivo_min INTEGER NOT NULL CHECK (tiempo_efectivo_min >= 0),
  tiempo_parado_min INTEGER NOT NULL DEFAULT 0 CHECK (tiempo_parado_min >= 0),
  pausas_texto TEXT,
  observaciones TEXT,
  ingreso_estimado NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registros_operario_fecha
  ON registros_operario (fecha DESC);

CREATE INDEX IF NOT EXISTS idx_registros_operario_operario
  ON registros_operario (operario);

CREATE OR REPLACE FUNCTION fn_registros_operario_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registros_operario_updated_at ON registros_operario;
CREATE TRIGGER trg_registros_operario_updated_at
BEFORE UPDATE ON registros_operario
FOR EACH ROW EXECUTE FUNCTION fn_registros_operario_set_updated_at();
