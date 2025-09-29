-- Ampliar precisión de valores unitarios y totales en detalle_cotizacion
-- Para preservar hasta 6 decimales ingresados en el frontend

BEGIN;

ALTER TABLE detalle_cotizacion
  ALTER COLUMN valor_unitario TYPE DECIMAL(18,6) USING valor_unitario::DECIMAL(18,6),
  ALTER COLUMN valor_total    TYPE DECIMAL(18,6) USING valor_total::DECIMAL(18,6);

COMMIT;


