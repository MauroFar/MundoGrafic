-- MIGRACIÓN 041: Agregar campos usados por el formulario offset que no tienen
-- una columna equivalente en detalle_orden_trabajo_offset.

ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS tamano_pliego              TEXT NULL,
  ADD COLUMN IF NOT EXISTS cabida_producto            TEXT NULL,
  ADD COLUMN IF NOT EXISTS guillotina_tamano_corte    TEXT NULL,
  ADD COLUMN IF NOT EXISTS guillotina_cabida_corte    TEXT NULL,
  ADD COLUMN IF NOT EXISTS prensas_pliegos_imprimir   TEXT NULL,
  ADD COLUMN IF NOT EXISTS prensas_cabida_impresion   TEXT NULL,
  ADD COLUMN IF NOT EXISTS prensas_total_impresion    TEXT NULL;
