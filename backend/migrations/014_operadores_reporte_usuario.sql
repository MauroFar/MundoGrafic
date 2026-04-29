BEGIN;

-- 1) Vinculo principal: cada reporte apunta al usuario operador del sistema.
ALTER TABLE reportes_trabajo_diario
ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE RESTRICT;

-- 2) Backfill inicial usando coincidencia de nombre operador->usuario (normalizada).
--    Si no hay match unico, el registro queda sin usuario_id para revision manual.
WITH candidatos AS (
	SELECT
		r.id AS reporte_id,
		u.id AS usuario_id,
		ROW_NUMBER() OVER (
			PARTITION BY r.id
			ORDER BY u.id
		) AS rn,
		COUNT(*) OVER (PARTITION BY r.id) AS total_matches
	FROM reportes_trabajo_diario r
	JOIN operadores_reporte o ON o.id = r.operador_id
	JOIN usuarios u
		ON LOWER(TRIM(u.nombre)) = LOWER(TRIM(o.nombre))
	WHERE r.usuario_id IS NULL
)
UPDATE reportes_trabajo_diario r
SET usuario_id = c.usuario_id
FROM candidatos c
WHERE r.id = c.reporte_id
	AND c.rn = 1
	AND c.total_matches = 1;

-- 3) Indice para filtros por operador/usuario.
CREATE INDEX IF NOT EXISTS idx_reportes_trabajo_diario_usuario_id
ON reportes_trabajo_diario(usuario_id);

-- 4) Normalizar area_id de reportes existentes al area actual del usuario mapeado.
UPDATE reportes_trabajo_diario r
SET area_id = u.area_id
FROM usuarios u
WHERE r.usuario_id = u.id
	AND u.area_id IS NOT NULL;

-- 5) Remover FKs legacy de reportes_trabajo_diario hacia tablas deprecadas.
DO $$
DECLARE fk_name text;
BEGIN
	IF to_regclass('public.areas_reporte') IS NOT NULL THEN
		FOR fk_name IN
			SELECT c.conname
			FROM pg_constraint c
			JOIN pg_class t ON t.oid = c.conrelid
			JOIN pg_class rt ON rt.oid = c.confrelid
			WHERE t.relname = 'reportes_trabajo_diario'
				AND rt.relname = 'areas_reporte'
		LOOP
			EXECUTE format('ALTER TABLE reportes_trabajo_diario DROP CONSTRAINT IF EXISTS %I', fk_name);
		END LOOP;
	END IF;

	IF to_regclass('public.operadores_reporte') IS NOT NULL THEN
		FOR fk_name IN
			SELECT c.conname
			FROM pg_constraint c
			JOIN pg_class t ON t.oid = c.conrelid
			JOIN pg_class rt ON rt.oid = c.confrelid
			WHERE t.relname = 'reportes_trabajo_diario'
				AND rt.relname = 'operadores_reporte'
		LOOP
			EXECUTE format('ALTER TABLE reportes_trabajo_diario DROP CONSTRAINT IF EXISTS %I', fk_name);
		END LOOP;
	END IF;
END $$;

-- 6) Eliminar columna operador legacy.
ALTER TABLE reportes_trabajo_diario
DROP COLUMN IF EXISTS operador_id;

-- 7) Garantizar FK a catalogo oficial de areas (sin bloquear por datos historicos).
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_reportes_trabajo_diario_area_id_areas'
	) THEN
		ALTER TABLE reportes_trabajo_diario
		ADD CONSTRAINT fk_reportes_trabajo_diario_area_id_areas
		FOREIGN KEY (area_id)
		REFERENCES areas(id)
		NOT VALID;
	END IF;
END $$;

-- 8) Eliminar tablas legacy de reportes.
DROP TABLE IF EXISTS operadores_reporte CASCADE;
DROP TABLE IF EXISTS areas_reporte CASCADE;

-- 9) Vista de control para detectar reportes aun no mapeados.
-- SELECT id, fecha
-- FROM reportes_trabajo_diario
-- WHERE usuario_id IS NULL
-- ORDER BY fecha DESC, id DESC;

COMMIT;