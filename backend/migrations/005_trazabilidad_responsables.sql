-- =============================================================================
-- MIGRACION 005: Trazabilidad relacional + auditoria (camino definitivo)
-- Fecha: 2026-04-02
-- Descripcion:
--   - Crea tabla relacional para trazabilidad por proceso.
--   - Crea tabla de auditoria de cambios.
--   - Agrega indices y restricciones para consultas y calidad de datos.
--   - Esta migracion reemplaza el enfoque JSONB como fuente principal.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Tabla relacional principal de trazabilidad
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trazabilidad_proceso (
  id BIGSERIAL PRIMARY KEY,

  id_detalle_digital BIGINT NULL REFERENCES detalle_orden_trabajo_digital(id) ON DELETE CASCADE,
  id_detalle_offset BIGINT NULL REFERENCES detalle_orden_trabajo_offset(id) ON DELETE CASCADE,

  proceso VARCHAR(40) NOT NULL,
  responsable VARCHAR(150) NULL,

  fecha_inicio DATE NULL,
  hora_inicio TIME NULL,
  fecha_fin DATE NULL,
  hora_fin TIME NULL,

  cantidad NUMERIC(14,2) NULL,
  observaciones TEXT NULL,
  firma TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(120) NULL,
  updated_by VARCHAR(120) NULL,

  CONSTRAINT ck_trazabilidad_detalle_unico
    CHECK (
      (id_detalle_digital IS NOT NULL AND id_detalle_offset IS NULL)
      OR
      (id_detalle_digital IS NULL AND id_detalle_offset IS NOT NULL)
    ),

  CONSTRAINT ck_trazabilidad_proceso
    CHECK (proceso IN (
      'preprensa',
      'impresion',
      'laminado',
      'troquelado',
      'terminados',
      'liberacion_producto'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_trazabilidad_digital_proceso
  ON trazabilidad_proceso (id_detalle_digital, proceso)
  WHERE id_detalle_digital IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_trazabilidad_offset_proceso
  ON trazabilidad_proceso (id_detalle_offset, proceso)
  WHERE id_detalle_offset IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trazabilidad_proceso
  ON trazabilidad_proceso (proceso);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_responsable
  ON trazabilidad_proceso (responsable);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_fecha_inicio
  ON trazabilidad_proceso (fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_created_at
  ON trazabilidad_proceso (created_at);

-- -----------------------------------------------------------------------------
-- 2) Auditoria de cambios (INSERT/UPDATE/DELETE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trazabilidad_proceso_auditoria (
  id BIGSERIAL PRIMARY KEY,
  id_trazabilidad BIGINT NULL,
  operacion VARCHAR(10) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by VARCHAR(120) NULL,
  old_data JSONB NULL,
  new_data JSONB NULL
);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_auditoria_id_trazabilidad
  ON trazabilidad_proceso_auditoria (id_trazabilidad);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_auditoria_changed_at
  ON trazabilidad_proceso_auditoria (changed_at);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_auditoria_operacion
  ON trazabilidad_proceso_auditoria (operacion);

-- -----------------------------------------------------------------------------
-- 3) Trigger para updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trazabilidad_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trazabilidad_set_updated_at ON trazabilidad_proceso;
CREATE TRIGGER trg_trazabilidad_set_updated_at
BEFORE UPDATE ON trazabilidad_proceso
FOR EACH ROW
EXECUTE FUNCTION fn_trazabilidad_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4) Trigger de auditoria
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trazabilidad_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO trazabilidad_proceso_auditoria (
      id_trazabilidad, operacion, changed_by, old_data, new_data
    ) VALUES (
      NEW.id, 'INSERT', NEW.updated_by, NULL, to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO trazabilidad_proceso_auditoria (
      id_trazabilidad, operacion, changed_by, old_data, new_data
    ) VALUES (
      NEW.id, 'UPDATE', NEW.updated_by, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO trazabilidad_proceso_auditoria (
      id_trazabilidad, operacion, changed_by, old_data, new_data
    ) VALUES (
      OLD.id, 'DELETE', OLD.updated_by, to_jsonb(OLD), NULL
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_trazabilidad_auditoria ON trazabilidad_proceso;
CREATE TRIGGER trg_trazabilidad_auditoria
AFTER INSERT OR UPDATE OR DELETE ON trazabilidad_proceso
FOR EACH ROW
EXECUTE FUNCTION fn_trazabilidad_auditoria();

COMMIT;
