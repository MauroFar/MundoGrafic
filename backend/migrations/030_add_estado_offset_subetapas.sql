-- Migración: Añadir sub-etapas faltantes a estado_orden_offset (versión segura)
-- Inserta/actualiza las filas necesarias sin remapear ni eliminar referencias.

INSERT INTO estado_orden_offset (key, titulo, orden, color, activo)
VALUES
  ('pendiente', 'Pendiente', 0, '#6b7280', TRUE),
  ('en_preprensa', 'Preprensa', 1, '#3b82f6', TRUE),
  ('guillotinado', 'Guillotinado', 2, '#6366f1', TRUE),
  ('en_prensa', 'Prensa', 3, '#a78bfa', TRUE),
  ('barnizado', 'Barnizado', 4, '#f59e0b', TRUE),
  ('plastificado', 'Plastificado', 5, '#06b6d4', TRUE),
  ('troquelado', 'Troquelado', 6, '#14b8a6', TRUE),
  ('pegado', 'Pegado', 7, '#10b981', TRUE),
  ('terminados_mg', 'Terminados MG', 8, '#facc15', TRUE),
  ('terminados_externos', 'Terminados Externos', 9, '#9ca3af', TRUE),
  ('liberado', 'Producto Liberado', 10, '#6b7280', TRUE),
  ('entregado', 'Producto Entregado', 11, '#16a34a', TRUE),
  ('cancelado', 'Cancelado', 999, '#dc2626', TRUE)
ON CONFLICT (key) DO UPDATE SET titulo = EXCLUDED.titulo, orden = EXCLUDED.orden, color = EXCLUDED.color, activo = EXCLUDED.activo;

-- Nota: Esta versión es no destructiva — no remapea ni borra filas existentes.

-- Asegurar que las claves liberado/entregado queden activas (conservador)
UPDATE estado_orden_offset
SET activo = TRUE
WHERE key IN ('liberado','entregado');
