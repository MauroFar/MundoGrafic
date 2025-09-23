-- Script para corregir la tabla cotizaciones en el servidor
-- Ejecutar este script en PostgreSQL en tu servidor de producción

-- 1. Verificar si la tabla tiene el campo numero_cotizacion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'numero_cotizacion'
  ) THEN
    RAISE NOTICE 'Agregando campo numero_cotizacion...';
    ALTER TABLE cotizaciones ADD COLUMN numero_cotizacion INTEGER;
  ELSE
    RAISE NOTICE 'Campo numero_cotizacion ya existe.';
  END IF;
END$$;

-- 2. Crear secuencia si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND c.relname = 'cotizaciones_numero_cotizacion_seq'
  ) THEN
    RAISE NOTICE 'Creando secuencia cotizaciones_numero_cotizacion_seq...';
    CREATE SEQUENCE cotizaciones_numero_cotizacion_seq START 1;
  ELSE
    RAISE NOTICE 'Secuencia cotizaciones_numero_cotizacion_seq ya existe.';
  END IF;
END$$;

-- 3. Asignar números a cotizaciones existentes que no tengan numero_cotizacion
UPDATE cotizaciones 
SET numero_cotizacion = nextval('cotizaciones_numero_cotizacion_seq')
WHERE numero_cotizacion IS NULL;

-- 4. Ajustar la secuencia al máximo valor actual
SELECT setval('cotizaciones_numero_cotizacion_seq', 
  COALESCE((SELECT MAX(numero_cotizacion) FROM cotizaciones), 0)
);

-- 5. Hacer el campo NOT NULL y único
ALTER TABLE cotizaciones ALTER COLUMN numero_cotizacion SET NOT NULL;

-- Crear índice único si no existe
CREATE UNIQUE INDEX IF NOT EXISTS cotizaciones_numero_cotizacion_unique
  ON cotizaciones (numero_cotizacion);

-- 6. Agregar otros campos faltantes si es necesario
DO $$
BEGIN
  -- Agregar campos de cotización
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'fecha') THEN
    ALTER TABLE cotizaciones ADD COLUMN fecha DATE;
    RAISE NOTICE 'Campo fecha agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'subtotal') THEN
    ALTER TABLE cotizaciones ADD COLUMN subtotal DECIMAL(10,2);
    RAISE NOTICE 'Campo subtotal agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'iva') THEN
    ALTER TABLE cotizaciones ADD COLUMN iva DECIMAL(10,2);
    RAISE NOTICE 'Campo iva agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'descuento') THEN
    ALTER TABLE cotizaciones ADD COLUMN descuento DECIMAL(10,2);
    RAISE NOTICE 'Campo descuento agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'ruc_id') THEN
    ALTER TABLE cotizaciones ADD COLUMN ruc_id INTEGER;
    RAISE NOTICE 'Campo ruc_id agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'tiempo_entrega') THEN
    ALTER TABLE cotizaciones ADD COLUMN tiempo_entrega VARCHAR(255);
    RAISE NOTICE 'Campo tiempo_entrega agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'forma_pago') THEN
    ALTER TABLE cotizaciones ADD COLUMN forma_pago VARCHAR(255);
    RAISE NOTICE 'Campo forma_pago agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'validez_proforma') THEN
    ALTER TABLE cotizaciones ADD COLUMN validez_proforma VARCHAR(255);
    RAISE NOTICE 'Campo validez_proforma agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'observaciones') THEN
    ALTER TABLE cotizaciones ADD COLUMN observaciones TEXT;
    RAISE NOTICE 'Campo observaciones agregado.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'nombre_ejecutivo') THEN
    ALTER TABLE cotizaciones ADD COLUMN nombre_ejecutivo VARCHAR(255);
    RAISE NOTICE 'Campo nombre_ejecutivo agregado.';
  END IF;
END$$;

-- 7. Verificar estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'cotizaciones'
ORDER BY ordinal_position;

-- 8. Mostrar estado de la secuencia
SELECT 
  last_value, 
  increment_by,
  is_called
FROM cotizaciones_numero_cotizacion_seq;

RAISE NOTICE 'Script ejecutado exitosamente. La tabla cotizaciones está lista.';
