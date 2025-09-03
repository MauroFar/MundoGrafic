-- Migración simple para agregar campos de firma personalizada a usuarios
-- Fecha: 2025-01-27

-- Agregar campos de firma personalizada a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS firma_html TEXT,
ADD COLUMN IF NOT EXISTS firma_activa BOOLEAN DEFAULT true;

-- Comentarios sobre la estructura
COMMENT ON COLUMN usuarios.firma_html IS 'Código HTML de la firma personalizada del ejecutivo';
COMMENT ON COLUMN usuarios.firma_activa IS 'Indica si la firma personalizada está activa';
