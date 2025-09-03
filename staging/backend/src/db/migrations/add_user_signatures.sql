-- Migración para agregar campos de firma personalizada a usuarios
-- Fecha: 2025-01-27

-- Agregar campos de firma personalizada a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS firma_nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS firma_cargo VARCHAR(255),
ADD COLUMN IF NOT EXISTS firma_extension VARCHAR(50),
ADD COLUMN IF NOT EXISTS firma_telefono VARCHAR(50),
ADD COLUMN IF NOT EXISTS firma_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS firma_activa BOOLEAN DEFAULT true;

-- Crear tabla para almacenar imágenes de firma personalizadas
CREATE TABLE IF NOT EXISTS firmas_usuarios (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  tipo_imagen VARCHAR(50) NOT NULL, -- 'logo', 'facebook', 'instagram', 'youtube', etc.
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_firmas_usuarios_usuario_id ON firmas_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_firmas_usuarios_tipo ON firmas_usuarios(tipo_imagen);

-- Insertar datos de firma por defecto para usuarios existentes
UPDATE usuarios 
SET 
  firma_nombre = 'Henry Calderón Burbano',
  firma_cargo = 'Ejecutivo de Ventas',
  firma_extension = '117',
  firma_telefono = '+593 2 2563 424',
  firma_email = 'ventas@mundografic.com',
  firma_activa = true
WHERE firma_nombre IS NULL;

-- Comentarios sobre la estructura
COMMENT ON COLUMN usuarios.firma_nombre IS 'Nombre completo para la firma del ejecutivo';
COMMENT ON COLUMN usuarios.firma_cargo IS 'Cargo o título del ejecutivo';
COMMENT ON COLUMN usuarios.firma_extension IS 'Número de extensión telefónica';
COMMENT ON COLUMN usuarios.firma_telefono IS 'Número de teléfono principal';
COMMENT ON COLUMN usuarios.firma_email IS 'Email personalizado del ejecutivo';
COMMENT ON COLUMN usuarios.firma_activa IS 'Indica si la firma personalizada está activa';
COMMENT ON COLUMN firmas_usuarios.tipo_imagen IS 'Tipo de imagen: logo, facebook, instagram, youtube, etc.';
COMMENT ON COLUMN firmas_usuarios.nombre_archivo IS 'Nombre original del archivo';
COMMENT ON COLUMN firmas_usuarios.ruta_archivo IS 'Ruta completa del archivo en el servidor';
