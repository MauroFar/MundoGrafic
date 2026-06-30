-- Asegura que los historiales de cambio de estado de producción tengan columna de nota/observaciones
ALTER TABLE estado_orden_digital_historial
  ADD COLUMN IF NOT EXISTS nota TEXT;

ALTER TABLE estado_orden_offset_historial
  ADD COLUMN IF NOT EXISTS nota TEXT;
