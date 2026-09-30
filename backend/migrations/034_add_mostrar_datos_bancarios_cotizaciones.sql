-- MIGRACION 034: Agregar columna mostrar_datos_bancarios a cotizaciones
-- Objetivo:
--   Permite controlar si se muestran los datos bancarios en el PDF de la cotización.
--   Por defecto true para mantener comportamiento anterior.

BEGIN;

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS mostrar_datos_bancarios BOOLEAN NOT NULL DEFAULT true;

COMMIT;
