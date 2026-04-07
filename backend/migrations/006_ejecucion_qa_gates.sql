-- =============================================================================
-- MIGRACIÓN 006: Registro de ejecución de etapas + Control de calidad (gates)
-- Fecha: 2026-04-06
-- Descripción:
--   Tablas para el flujo:
--   Operario registra ejecución → envía a calidad → QA aprueba / rechaza
--   Las dos tablas complementan trazabilidad_proceso (migración 005).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Tabla de registro de ejecución de etapa
--    El operario llena esto ANTES de enviar a calidad.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ejecucion_etapa (
  id               BIGSERIAL PRIMARY KEY,
  orden_trabajo_id BIGINT       NOT NULL REFERENCES orden_trabajo(id)   ON DELETE CASCADE,
  etapa_id         VARCHAR(40)  NOT NULL,           -- en_prensa, laminado, etc.
  etapa_titulo     VARCHAR(120) NULL,

  -- Datos generales (comunes a todas las etapas)
  operario         VARCHAR(150) NOT NULL,
  fecha_inicio     DATE         NULL,
  hora_inicio      TIME         NULL,
  fecha_fin        DATE         NULL,
  hora_fin         TIME         NULL,

  -- Datos específicos de la etapa almacenados como JSONB
  -- (flexible para adaptar campos sin nuevas migraciones)
  datos_etapa      JSONB        NOT NULL DEFAULT '{}',

  -- Cierre
  reproceso        BOOLEAN      NOT NULL DEFAULT FALSE,
  motivo_reproceso TEXT         NULL,
  observaciones    TEXT         NULL,

  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  created_by       VARCHAR(120) NULL,

  -- Una orden sólo puede tener un registro activo por etapa
  CONSTRAINT uq_ejecucion_orden_etapa UNIQUE (orden_trabajo_id, etapa_id)
);

CREATE INDEX IF NOT EXISTS idx_ejecucion_orden_trabajo_id
  ON ejecucion_etapa (orden_trabajo_id);

CREATE INDEX IF NOT EXISTS idx_ejecucion_etapa_id
  ON ejecucion_etapa (etapa_id);

CREATE INDEX IF NOT EXISTS idx_ejecucion_created_at
  ON ejecucion_etapa (created_at);

-- trigger updated_at
CREATE OR REPLACE FUNCTION fn_ejecucion_etapa_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ejecucion_etapa_updated_at ON ejecucion_etapa;
CREATE TRIGGER trg_ejecucion_etapa_updated_at
BEFORE UPDATE ON ejecucion_etapa
FOR EACH ROW EXECUTE FUNCTION fn_ejecucion_etapa_set_updated_at();


-- ---------------------------------------------------------------------------
-- 2) Tabla de gates de control de calidad
--    El inspector QA aprueba o rechaza después de ver el registro de ejecución.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qa_gate (
  id               BIGSERIAL    PRIMARY KEY,
  orden_trabajo_id BIGINT       NOT NULL REFERENCES orden_trabajo(id)   ON DELETE CASCADE,
  etapa_id         VARCHAR(40)  NOT NULL,
  etapa_titulo     VARCHAR(120) NULL,

  -- Una orden puede pasar por calidad varias veces (reprocesos)
  intento          SMALLINT     NOT NULL DEFAULT 1,

  -- Estado del gate: pendiente | aprobado | rechazado | condicionado
  estado           VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','aprobado','rechazado','condicionado')),

  -- Datos del inspector QA
  resultado_control   VARCHAR(20)  NULL
                      CHECK (resultado_control IN ('pendiente','aprobado','condicionado','rechazado')),
  inspector            VARCHAR(150) NULL,
  turno                VARCHAR(20)  NULL CHECK (turno IN ('Manana','Tarde','Noche')),
  maquina_equipo       VARCHAR(120) NULL,
  unidad_medida        VARCHAR(60)  NULL,
  lote_version_arte    VARCHAR(120) NULL,

  -- No conformidad
  motivo_no_conformidad TEXT NULL,
  accion_correctiva     TEXT NULL,

  -- Cierre QA
  observaciones         TEXT        NULL,
  cierre_qa_responsable VARCHAR(150) NULL,
  cierre_qa_fecha       DATE        NULL,
  cierre_qa_hora        TIME        NULL,

  -- Referencia cruzada con el registro de ejecución
  ejecucion_etapa_id   BIGINT NULL REFERENCES ejecucion_etapa(id) ON DELETE SET NULL,

  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by  VARCHAR(120) NULL,
  updated_by  VARCHAR(120) NULL,

  CONSTRAINT uq_qa_gate_orden_etapa_intento UNIQUE (orden_trabajo_id, etapa_id, intento)
);

CREATE INDEX IF NOT EXISTS idx_qa_gate_orden_trabajo_id
  ON qa_gate (orden_trabajo_id);

CREATE INDEX IF NOT EXISTS idx_qa_gate_estado
  ON qa_gate (estado);

CREATE INDEX IF NOT EXISTS idx_qa_gate_etapa_id
  ON qa_gate (etapa_id);

CREATE INDEX IF NOT EXISTS idx_qa_gate_created_at
  ON qa_gate (created_at);

-- trigger updated_at
CREATE OR REPLACE FUNCTION fn_qa_gate_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_qa_gate_updated_at ON qa_gate;
CREATE TRIGGER trg_qa_gate_updated_at
BEFORE UPDATE ON qa_gate
FOR EACH ROW EXECUTE FUNCTION fn_qa_gate_set_updated_at();


-- ---------------------------------------------------------------------------
-- 3) Vista útil para el inspector QA
--    Muestra la última revisión por orden + etapa junto con el registro
--    del operario.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_qa_pendientes AS
SELECT
  qg.id                   AS qa_gate_id,
  qg.orden_trabajo_id,
  ot.numero_orden,
  ot.nombre_cliente,
  qg.etapa_id,
  qg.etapa_titulo,
  qg.intento,
  qg.estado               AS estado_qa,
  qg.resultado_control,
  qg.inspector,
  qg.observaciones,
  qg.created_at           AS ingreso_qa,
  ee.operario,
  ee.fecha_inicio,
  ee.hora_inicio,
  ee.fecha_fin,
  ee.hora_fin,
  ee.datos_etapa,
  ee.reproceso,
  ee.motivo_reproceso,
  ee.observaciones        AS obs_operario
FROM qa_gate qg
JOIN orden_trabajo ot   ON ot.id = qg.orden_trabajo_id
LEFT JOIN ejecucion_etapa ee ON ee.id = qg.ejecucion_etapa_id
ORDER BY qg.created_at DESC;

COMMIT;
