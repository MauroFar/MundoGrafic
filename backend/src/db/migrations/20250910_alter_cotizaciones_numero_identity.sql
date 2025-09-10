-- Hacer numero_cotizacion autogenerado y único para evitar colisiones por concurrencia
-- Asume PostgreSQL

-- 1) Crear secuencia si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND c.relname = 'cotizaciones_numero_cotizacion_seq'
  ) THEN
    CREATE SEQUENCE cotizaciones_numero_cotizacion_seq START 1;
  END IF;
END$$;

-- 2) Asegurar tipo numérico y valor por defecto desde secuencia
-- Si la columna es texto, intentar castear a integer primero. Ajusta según tu esquema actual.
ALTER TABLE cotizaciones
  ALTER COLUMN numero_cotizacion TYPE INTEGER USING (CASE
    WHEN numero_cotizacion ~ '^\\d+$' THEN numero_cotizacion::integer
    ELSE NULL
  END);

-- 3) Establecer DEFAULT a nextval de la secuencia
ALTER TABLE cotizaciones
  ALTER COLUMN numero_cotizacion SET DEFAULT nextval('cotizaciones_numero_cotizacion_seq');

-- 4) Rellenar la secuencia al máximo actual para evitar duplicados
SELECT setval('cotizaciones_numero_cotizacion_seq', COALESCE((SELECT MAX(numero_cotizacion) FROM cotizaciones), 0));

-- 5) Hacer la columna NOT NULL si aplica y única
ALTER TABLE cotizaciones
  ALTER COLUMN numero_cotizacion SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cotizaciones_numero_cotizacion_unique
  ON cotizaciones (numero_cotizacion);


