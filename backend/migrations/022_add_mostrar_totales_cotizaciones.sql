-- MIGRACION 022: Agregar columna mostrar_totales a cotizaciones
-- Objetivo:
--   Permite controlar si se muestran los totales (subtotal, iva, descuento, total)
--   en el PDF de la cotización. Por defecto true para mantener comportamiento anterior.

BEGIN;

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS mostrar_totales BOOLEAN NOT NULL DEFAULT true;

COMMIT;
