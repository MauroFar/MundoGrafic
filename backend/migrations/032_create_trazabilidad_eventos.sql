BEGIN;

CREATE TABLE IF NOT EXISTS pedido_orden_trazabilidad_eventos (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NULL,
  orden_trabajo_id BIGINT NULL,
  tipo_evento VARCHAR(50) NOT NULL,
  evento VARCHAR(80) NOT NULL,
  descripcion TEXT,
  estado_key VARCHAR(80),
  estado_titulo VARCHAR(120),
  etapa_id VARCHAR(80),
  etapa_titulo VARCHAR(120),
  usuario_id BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  origen VARCHAR(40) NOT NULL DEFAULT 'system',

  CONSTRAINT fk_pedido_orden_trazabilidad_pedido
    FOREIGN KEY (pedido_id) REFERENCES lista_pedidos(id) ON DELETE SET NULL,

  CONSTRAINT fk_pedido_orden_trazabilidad_orden
    FOREIGN KEY (orden_trabajo_id) REFERENCES orden_trabajo(id) ON DELETE SET NULL,

  CONSTRAINT ck_pedido_orden_trazabilidad_tipo_evento
    CHECK (
      tipo_evento IN (
        'pedido_creado',
        'orden_creada',
        'pedido_vinculado',
        'artes_aprobados',
        'enviado_produccion',
        'estado_cambiado',
        'etapa_iniciada',
        'etapa_finalizada',
        'qa_registrado',
        'qa_aprobado',
        'entregado',
        'cancelado',
        'reproceso'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_eventos_pedido
  ON pedido_orden_trazabilidad_eventos (pedido_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_eventos_orden
  ON pedido_orden_trazabilidad_eventos (orden_trabajo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_eventos_tipo
  ON pedido_orden_trazabilidad_eventos (tipo_evento, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_eventos_estado
  ON pedido_orden_trazabilidad_eventos (estado_key, created_at DESC);

CREATE OR REPLACE VIEW vw_trazabilidad_pedido_orden AS
SELECT
  e.id,
  e.pedido_id,
  e.orden_trabajo_id,
  e.tipo_evento,
  e.evento,
  e.descripcion,
  e.estado_key,
  e.estado_titulo,
  e.etapa_id,
  e.etapa_titulo,
  e.usuario_id,
  u.nombre AS usuario_nombre,
  e.created_at,
  e.metadata,
  e.origen
FROM pedido_orden_trazabilidad_eventos e
LEFT JOIN usuarios u ON u.id = e.usuario_id
ORDER BY e.created_at ASC;

COMMIT;
