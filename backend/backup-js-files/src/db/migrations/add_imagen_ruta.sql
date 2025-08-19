-- Agregar columna imagen_ruta a la tabla detalle_cotizacion
ALTER TABLE detalle_cotizacion ADD COLUMN IF NOT EXISTS imagen_ruta VARCHAR(255); 