ALTER TABLE detalle_cotizacion
ADD COLUMN IF NOT EXISTS usa_escalas BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS detalle_cotizacion_escalas (
  id BIGSERIAL PRIMARY KEY,
  detalle_cotizacion_id BIGINT NOT NULL REFERENCES detalle_cotizacion(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  valor_unitario NUMERIC(14,6) NOT NULL DEFAULT 0 CHECK (valor_unitario >= 0),
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_total >= 0),
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detalle_cotizacion_escalas_detalle_id
  ON detalle_cotizacion_escalas (detalle_cotizacion_id, orden);

CREATE OR REPLACE FUNCTION fn_detalle_cotizacion_escalas_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_detalle_cotizacion_escalas_updated_at ON detalle_cotizacion_escalas;
CREATE TRIGGER trg_detalle_cotizacion_escalas_updated_at
BEFORE UPDATE ON detalle_cotizacion_escalas
FOR EACH ROW EXECUTE FUNCTION fn_detalle_cotizacion_escalas_set_updated_at();

INSERT INTO detalle_cotizacion_escalas (detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden)
SELECT dc.id,
       COALESCE(dc.cantidad, 0),
       COALESCE(dc.valor_unitario, 0),
       COALESCE(dc.valor_total, 0),
       0
FROM detalle_cotizacion dc
WHERE NOT EXISTS (
  SELECT 1
  FROM detalle_cotizacion_escalas dce
  WHERE dce.detalle_cotizacion_id = dc.id
);