ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS codigo_producto VARCHAR(120);

COMMENT ON COLUMN detalle_orden_trabajo_offset.codigo_producto IS 'Código manual del producto asociado a la orden de trabajo offset';
