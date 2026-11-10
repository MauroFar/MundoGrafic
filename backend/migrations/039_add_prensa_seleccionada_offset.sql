-- =============================================================================
-- MIGRACIÓN 039: Add prensa_seleccionada a detalle_orden_trabajo_offset
-- Fecha: 2026-11-10
-- Descripción:
--   Guarda la prensa seleccionada por el usuario dentro de la orden offset.
--   Este valor no debe mezclarse con el responsable de prensa (campo `prensa`),
--   ya que representa la máquina/selección de prensa del trabajo.
-- =============================================================================

ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS prensa_seleccionada VARCHAR;

-- Actualiza datos existentes si alguna orden ya tenía el valor en la columna `prensa`
-- y se esperaba como selección de prensa.
UPDATE detalle_orden_trabajo_offset
SET prensa_seleccionada = prensa
WHERE prensa_seleccionada IS NULL
  AND prensa IS NOT NULL;
