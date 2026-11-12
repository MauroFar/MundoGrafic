-- MIGRACIÓN 040: Agregar estilo por secciones para detalle_orden_trabajo_offset
-- Permite guardar los estilos de color/negrita/subrayado que se usan en los campos del PDF y la UI.

ALTER TABLE detalle_orden_trabajo_offset
  ADD COLUMN IF NOT EXISTS estilo_secciones_offset JSONB NULL;
