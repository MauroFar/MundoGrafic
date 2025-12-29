-- Crear tabla para múltiples imágenes por detalle de cotización
CREATE TABLE IF NOT EXISTS detalle_cotizacion_imagenes (
  id SERIAL PRIMARY KEY,
  detalle_cotizacion_id INTEGER NOT NULL,
  imagen_ruta VARCHAR(500) NOT NULL,
  orden INTEGER DEFAULT 0,
  imagen_width INTEGER DEFAULT 200,
  imagen_height INTEGER DEFAULT 150,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (detalle_cotizacion_id) REFERENCES detalle_cotizacion(id) ON DELETE CASCADE
);

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_detalle_imagenes_detalle 
  ON detalle_cotizacion_imagenes(detalle_cotizacion_id);

-- Migrar imágenes existentes de detalle_cotizacion a la nueva tabla
INSERT INTO detalle_cotizacion_imagenes (detalle_cotizacion_id, imagen_ruta, orden, imagen_width, imagen_height)
SELECT 
  id as detalle_cotizacion_id,
  imagen_ruta,
  0 as orden,
  COALESCE(imagen_width, 200) as imagen_width,
  COALESCE(imagen_height, 150) as imagen_height
FROM detalle_cotizacion
WHERE imagen_ruta IS NOT NULL AND imagen_ruta != '';

-- Comentar las columnas viejas (no las eliminamos por seguridad)
COMMENT ON COLUMN detalle_cotizacion.imagen_ruta IS 'DEPRECATED: Usar detalle_cotizacion_imagenes';
COMMENT ON COLUMN detalle_cotizacion.imagen_width IS 'DEPRECATED: Usar detalle_cotizacion_imagenes';
COMMENT ON COLUMN detalle_cotizacion.imagen_height IS 'DEPRECATED: Usar detalle_cotizacion_imagenes';
