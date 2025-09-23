-- Migración para corregir la estructura de la tabla cotizaciones
-- Esta migración agrega todos los campos faltantes que el sistema necesita

-- 1. Agregar campos faltantes a la tabla cotizaciones
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS fecha DATE,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS iva DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS descuento DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS ruc_id INTEGER,
ADD COLUMN IF NOT EXISTS tiempo_entrega VARCHAR(255),
ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(255),
ADD COLUMN IF NOT EXISTS validez_proforma VARCHAR(255),
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS nombre_ejecutivo VARCHAR(255);

-- 2. Crear secuencia para numero_cotizacion si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND c.relname = 'cotizaciones_numero_cotizacion_seq'
  ) THEN
    CREATE SEQUENCE cotizaciones_numero_cotizacion_seq START 1;
  END IF;
END$$;

-- 3. Agregar campo numero_cotizacion si no existe
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS numero_cotizacion INTEGER;

-- 4. Establecer valor por defecto para numero_cotizacion desde la secuencia
ALTER TABLE cotizaciones
ALTER COLUMN numero_cotizacion SET DEFAULT nextval('cotizaciones_numero_cotizacion_seq');

-- 5. Rellenar la secuencia al máximo actual para evitar duplicados
SELECT setval('cotizaciones_numero_cotizacion_seq', COALESCE((SELECT MAX(numero_cotizacion) FROM cotizaciones WHERE numero_cotizacion IS NOT NULL), 0));

-- 6. Actualizar registros existentes que no tengan numero_cotizacion
UPDATE cotizaciones 
SET numero_cotizacion = nextval('cotizaciones_numero_cotizacion_seq')
WHERE numero_cotizacion IS NULL;

-- 7. Hacer la columna NOT NULL y única
ALTER TABLE cotizaciones
ALTER COLUMN numero_cotizacion SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cotizaciones_numero_cotizacion_unique
  ON cotizaciones (numero_cotizacion);

-- 8. Crear tabla detalle_cotizacion si no existe
CREATE TABLE IF NOT EXISTS detalle_cotizacion (
  id SERIAL PRIMARY KEY,
  cotizacion_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  detalle TEXT NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  imagen_ruta VARCHAR(500),
  imagen_width INTEGER,
  imagen_height INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
);

-- 9. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cotizaciones_numero ON cotizaciones(numero_cotizacion);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON cotizaciones(fecha);
CREATE INDEX IF NOT EXISTS idx_detalle_cotizacion_cotizacion ON detalle_cotizacion(cotizacion_id);

-- 10. Agregar campos faltantes a la tabla clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
ADD COLUMN IF NOT EXISTS email_cliente VARCHAR(255);

-- 11. Agregar campos faltantes a la tabla rucs
ALTER TABLE rucs
ADD COLUMN IF NOT EXISTS descripcion VARCHAR(255);
