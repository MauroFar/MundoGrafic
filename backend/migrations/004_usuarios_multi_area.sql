-- =============================================================================
-- MIGRACION 004: Soporte de multiples areas por usuario
-- Fecha: 2026-04-01
-- Descripcion:
--   - Crea tabla puente usuarios_areas (N:N)
--   - Migra el area_id actual de usuarios como area principal
--   - Mantiene compatibilidad: NO elimina ni modifica usuarios.area_id
--
-- NOTA:
--   Esta migracion no rompe el sistema actual. Solo habilita la nueva estructura
--   para evolucionar backend/frontend a multi-area progresivamente.
-- =============================================================================

BEGIN;

-- 1) Tabla puente usuarios <-> areas
CREATE TABLE IF NOT EXISTS usuarios_areas (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, area_id)
);

-- 2) Indices para consultas por usuario/area
CREATE INDEX IF NOT EXISTS idx_usuarios_areas_usuario_id ON usuarios_areas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_areas_area_id ON usuarios_areas(area_id);

-- 3) Asegurar maximo una area principal por usuario
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_areas_principal
  ON usuarios_areas(usuario_id)
  WHERE es_principal = TRUE;  

-- 4) Backfill: copiar area_id actual de usuarios a la tabla puente
INSERT INTO usuarios_areas (usuario_id, area_id, es_principal)
SELECT u.id, u.area_id, TRUE
FROM usuarios u
WHERE u.area_id IS NOT NULL
ON CONFLICT (usuario_id, area_id)
DO UPDATE SET es_principal = TRUE, updated_at = NOW();

-- 5) Verificacion rapida
-- Usuario debe tener al menos su area historica como principal en la tabla puente
SELECT
  ua.usuario_id,
  ua.area_id,
  ua.es_principal,
  ua.created_at
FROM usuarios_areas ua
ORDER BY ua.usuario_id, ua.es_principal DESC, ua.area_id
LIMIT 30;

COMMIT;
