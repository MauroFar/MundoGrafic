ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS tipo_cotizacion VARCHAR(20);

UPDATE cotizaciones
SET tipo_cotizacion = NULL
WHERE tipo_cotizacion IS NOT NULL
  AND tipo_cotizacion NOT IN ('offset', 'digital');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.cotizaciones'::regclass
      AND conname = 'cotizaciones_tipo_cotizacion_chk'
  ) THEN
    ALTER TABLE cotizaciones
      ADD CONSTRAINT cotizaciones_tipo_cotizacion_chk
      CHECK (
        tipo_cotizacion IS NULL OR tipo_cotizacion IN ('offset', 'digital')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cotizaciones_tipo_cotizacion
  ON cotizaciones (tipo_cotizacion);
