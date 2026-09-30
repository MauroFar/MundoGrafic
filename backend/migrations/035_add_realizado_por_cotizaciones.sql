-- MIGRACION 035: Agregar columna realizado_por a cotizaciones
-- Objetivo:
--   Permite guardar el nombre de la persona que realiza la cotización
--   y mostrarlo en el PDF como "Realizado por:".
--   El valor por defecto es null para que el usuario pueda dejarlo en blanco.

BEGIN;

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS realizado_por TEXT;

COMMIT;
