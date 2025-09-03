-- Agregar campos de dimensiones de imagen a la tabla detalle_cotizacion
ALTER TABLE detalle_cotizacion
ADD COLUMN imagen_width INTEGER DEFAULT 300,
ADD COLUMN imagen_height INTEGER DEFAULT 200; 