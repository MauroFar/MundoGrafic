BEGIN;

ALTER TABLE detalle_cotizacion_imagenes
  ADD COLUMN IF NOT EXISTS imagen_rotacion INTEGER NOT NULL DEFAULT 0;

UPDATE detalle_cotizacion_imagenes
SET imagen_rotacion = 0
WHERE imagen_rotacion IS NULL;

COMMIT;
