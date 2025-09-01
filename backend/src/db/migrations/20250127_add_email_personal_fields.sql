-- Migración para agregar campos de email personalizado a usuarios
-- Fecha: 2025-01-27
-- Descripción: Agrega campos para sistema de emails personalizados por ejecutivo

-- Agregar campos de email personalizado a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_personal VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_config VARCHAR(50);

-- Crear índice para mejorar rendimiento en búsquedas por email_config
CREATE INDEX IF NOT EXISTS idx_usuarios_email_config ON usuarios(email_config);

-- Crear índice para mejorar rendimiento en búsquedas por email_personal
CREATE INDEX IF NOT EXISTS idx_usuarios_email_personal ON usuarios(email_personal);

-- Comentarios sobre la estructura
COMMENT ON COLUMN usuarios.email_personal IS 'Email personal del ejecutivo para envío de correos';
COMMENT ON COLUMN usuarios.email_config IS 'Configuración de email generada automáticamente (ej: henry, carlos, etc.)';

-- Actualizar usuarios existentes que ya tengan email_personal configurado
-- Esto es para mantener consistencia si ya se configuraron manualmente
UPDATE usuarios 
SET email_config = LOWER(SPLIT_PART(email_personal, '@', 1))
WHERE email_personal IS NOT NULL 
  AND email_config IS NULL
  AND rol = 'ejecutivo';

-- Verificar que los campos se agregaron correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name IN ('email_personal', 'email_config');
