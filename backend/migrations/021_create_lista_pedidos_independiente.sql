-- MIGRACION 021: Lista de pedidos independiente + auditoria de cambios
-- Objetivo:
--   1) Crear tabla independiente para la interfaz de Lista de Pedidos.
--   2) Dejar campos de relacion futura (sin FK por ahora).
--   3) Registrar trazabilidad de INSERT/UPDATE/DELETE con snapshots JSONB.

BEGIN;

-- 1) Tabla principal: lista_pedidos
CREATE TABLE IF NOT EXISTS lista_pedidos (
  id BIGSERIAL PRIMARY KEY,

  fecha_ingreso_pedido DATE NOT NULL,
  fecha_entrega DATE NULL,

  responsable_nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  descripcion_producto TEXT NOT NULL,

  cantidad NUMERIC(14,2) NOT NULL DEFAULT 0,
  no_oc TEXT NULL,
  no_op TEXT NULL,

  estado TEXT NOT NULL DEFAULT 'Sin empezar',
  fase TEXT NULL,

  no_factura TEXT NULL,
  observaciones TEXT NULL,

  -- Campos para vinculos futuros (sin FK por ahora)
  responsable_usuario_id BIGINT NULL,
  cotizacion_id BIGINT NULL,
  orden_trabajo_id BIGINT NULL,

  -- Metadata y trazabilidad base
  created_by BIGINT NULL,
  updated_by BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_lista_pedidos_cantidad_nonneg
    CHECK (cantidad >= 0),

  CONSTRAINT ck_lista_pedidos_estado
    CHECK (estado IN ('Sin empezar', 'En proceso', 'Atrasado', 'Completo', 'Rechazado')),

  CONSTRAINT ck_lista_pedidos_fase
    CHECK (
      fase IS NULL OR fase IN (
        'Aprobacion de ficha tecnica',
        'Preprensa',
        'Guillotinado',
        'Prensa',
        'Barnizado',
        'Plastificado',
        'Troquelado',
        'Pegado',
        'Terminados MG',
        'Terminados externos',
        'Empaque',
        'Liberado',
        'Facturado',
        'Entregado',
        'Entrega incompleta'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_fecha_ingreso
  ON lista_pedidos (fecha_ingreso_pedido);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_estado
  ON lista_pedidos (estado);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_fase
  ON lista_pedidos (fase);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_responsable
  ON lista_pedidos (responsable_nombre);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_cliente
  ON lista_pedidos (cliente);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_created_at
  ON lista_pedidos (created_at);

-- 2) Tabla de auditoria: lista_pedidos_auditoria
CREATE TABLE IF NOT EXISTS lista_pedidos_auditoria (
  id BIGSERIAL PRIMARY KEY,
  lista_pedido_id BIGINT NULL,
  operacion VARCHAR(10) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by BIGINT NULL,
  old_data JSONB NULL,
  new_data JSONB NULL,

  CONSTRAINT ck_lista_pedidos_auditoria_operacion
    CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_auditoria_lista_pedido_id
  ON lista_pedidos_auditoria (lista_pedido_id);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_auditoria_changed_at
  ON lista_pedidos_auditoria (changed_at);

CREATE INDEX IF NOT EXISTS idx_lista_pedidos_auditoria_operacion
  ON lista_pedidos_auditoria (operacion);

-- 3) Trigger para updated_at
CREATE OR REPLACE FUNCTION fn_lista_pedidos_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lista_pedidos_set_updated_at ON lista_pedidos;
CREATE TRIGGER trg_lista_pedidos_set_updated_at
BEFORE UPDATE ON lista_pedidos
FOR EACH ROW
EXECUTE FUNCTION fn_lista_pedidos_set_updated_at();

-- 4) Trigger de auditoria
CREATE OR REPLACE FUNCTION fn_lista_pedidos_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO lista_pedidos_auditoria (
      lista_pedido_id, operacion, changed_by, old_data, new_data
    ) VALUES (
      NEW.id, 'INSERT', NEW.updated_by, NULL, to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO lista_pedidos_auditoria (
      lista_pedido_id, operacion, changed_by, old_data, new_data
    ) VALUES (
      NEW.id, 'UPDATE', NEW.updated_by, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSE
    INSERT INTO lista_pedidos_auditoria (
      lista_pedido_id, operacion, changed_by, old_data, new_data
    ) VALUES (
      OLD.id, 'DELETE', OLD.updated_by, to_jsonb(OLD), NULL
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lista_pedidos_auditoria ON lista_pedidos;
CREATE TRIGGER trg_lista_pedidos_auditoria
AFTER INSERT OR UPDATE OR DELETE ON lista_pedidos
FOR EACH ROW
EXECUTE FUNCTION fn_lista_pedidos_auditoria();

COMMIT;
