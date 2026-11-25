ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS materiales_adicionales JSONB NULL;
