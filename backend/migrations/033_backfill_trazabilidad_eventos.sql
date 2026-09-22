BEGIN;

INSERT INTO pedido_orden_trazabilidad_eventos (
  pedido_id,
  orden_trabajo_id,
  tipo_evento,
  evento,
  descripcion,
  estado_key,
  estado_titulo,
  etapa_id,
  etapa_titulo,
  usuario_id,
  created_at,
  metadata,
  origen
)
SELECT
  lp.id,
  lp.orden_trabajo_id,
  'pedido_creado',
  'Pedido creado',
  'Pedido registrado en la lista.',
  NULL,
  NULL,
  NULL,
  NULL,
  lp.created_by,
  lp.created_at,
  jsonb_build_object(
    'cliente', lp.cliente,
    'descripcion_producto', lp.descripcion_producto,
    'estado', lp.estado,
    'fase', lp.fase
  ),
  'system'
FROM lista_pedidos lp
WHERE lp.created_at IS NOT NULL
  AND lp.orden_trabajo_id IS NULL;

INSERT INTO pedido_orden_trazabilidad_eventos (
  pedido_id,
  orden_trabajo_id,
  tipo_evento,
  evento,
  descripcion,
  estado_key,
  estado_titulo,
  etapa_id,
  etapa_titulo,
  usuario_id,
  created_at,
  metadata,
  origen
)
SELECT
  lp.id,
  ot.id,
  'orden_creada',
  'Orden creada',
  'Orden de trabajo creada asociada al pedido.',
  NULL,
  NULL,
  NULL,
  NULL,
  ot.created_by,
  ot.created_at,
  jsonb_build_object(
    'numero_orden', ot.numero_orden,
    'tipo_orden', ot.tipo_orden,
    'cliente', ot.nombre_cliente
  ),
  'system'
FROM orden_trabajo ot
JOIN lista_pedidos lp ON lp.orden_trabajo_id = ot.id
WHERE ot.created_at IS NOT NULL;

INSERT INTO pedido_orden_trazabilidad_eventos (
  pedido_id,
  orden_trabajo_id,
  tipo_evento,
  evento,
  descripcion,
  estado_key,
  estado_titulo,
  etapa_id,
  etapa_titulo,
  usuario_id,
  created_at,
  metadata,
  origen
)
SELECT
  lp.id,
  h.orden_trabajo_id,
  CASE
    WHEN lower(COALESCE(h.nota, '')) LIKE '%artes%' AND lower(COALESCE(h.nota, '')) LIKE '%aprob%' THEN 'artes_aprobados'
    WHEN lower(COALESCE(h.nota, '')) LIKE '%enviad%' AND lower(COALESCE(h.nota, '')) LIKE '%producci%' THEN 'enviado_produccion'
    ELSE 'estado_cambiado'
  END,
  COALESCE(eod.titulo, 'Estado actualizado'),
  COALESCE(h.nota, CONCAT('Cambio de estado a ', COALESCE(eod.titulo, 'estado'))),
  eod.key,
  eod.titulo,
  NULL,
  NULL,
  h.usuario_id,
  h.creado_en,
  jsonb_build_object(
    'estado_id', h.estado_id,
    'nota', h.nota,
    'tabla', 'digital'
  ),
  'system'
FROM estado_orden_digital_historial h
LEFT JOIN estado_orden_digital eod ON eod.id = h.estado_id
LEFT JOIN lista_pedidos lp ON lp.orden_trabajo_id = h.orden_trabajo_id
WHERE h.creado_en IS NOT NULL
UNION ALL
SELECT
  lp.id,
  h.orden_trabajo_id,
  CASE
    WHEN lower(COALESCE(h.nota, '')) LIKE '%artes%' AND lower(COALESCE(h.nota, '')) LIKE '%aprob%' THEN 'artes_aprobados'
    WHEN lower(COALESCE(h.nota, '')) LIKE '%enviad%' AND lower(COALESCE(h.nota, '')) LIKE '%producci%' THEN 'enviado_produccion'
    ELSE 'estado_cambiado'
  END,
  COALESCE(eoo.titulo, 'Estado actualizado'),
  COALESCE(h.nota, CONCAT('Cambio de estado a ', COALESCE(eoo.titulo, 'estado'))),
  eoo.key,
  eoo.titulo,
  NULL,
  NULL,
  h.usuario_id,
  h.created_at,
  jsonb_build_object(
    'estado_id', h.estado_id,
    'nota', h.nota,
    'tabla', 'offset'
  ),
  'system'
FROM estado_orden_offset_historial h
LEFT JOIN estado_orden_offset eoo ON eoo.id = h.estado_id
LEFT JOIN lista_pedidos lp ON lp.orden_trabajo_id = h.orden_trabajo_id
WHERE h.created_at IS NOT NULL;

INSERT INTO pedido_orden_trazabilidad_eventos (
  pedido_id,
  orden_trabajo_id,
  tipo_evento,
  evento,
  descripcion,
  estado_key,
  estado_titulo,
  etapa_id,
  etapa_titulo,
  usuario_id,
  created_at,
  metadata,
  origen
)
SELECT
  lp.id,
  e.orden_trabajo_id,
  'etapa_iniciada',
  'Etapa iniciada',
  CONCAT('Se inició la etapa ', e.etapa_titulo),
  NULL,
  NULL,
  e.etapa_id,
  e.etapa_titulo,
  NULL,
  e.created_at,
  jsonb_build_object(
    'operario', e.operario,
    'fecha_inicio', e.fecha_inicio,
    'hora_inicio', e.hora_inicio
  ),
  'system'
FROM ejecucion_etapa e
LEFT JOIN lista_pedidos lp ON lp.orden_trabajo_id = e.orden_trabajo_id
WHERE e.fecha_inicio IS NOT NULL;

INSERT INTO pedido_orden_trazabilidad_eventos (
  pedido_id,
  orden_trabajo_id,
  tipo_evento,
  evento,
  descripcion,
  estado_key,
  estado_titulo,
  etapa_id,
  etapa_titulo,
  usuario_id,
  created_at,
  metadata,
  origen
)
SELECT
  lp.id,
  e.orden_trabajo_id,
  'etapa_finalizada',
  'Etapa finalizada',
  CONCAT('Se finalizó la etapa ', e.etapa_titulo),
  NULL,
  NULL,
  e.etapa_id,
  e.etapa_titulo,
  NULL,
  COALESCE(e.updated_at, e.created_at),
  jsonb_build_object(
    'operario', e.operario,
    'fecha_fin', e.fecha_fin,
    'hora_fin', e.hora_fin
  ),
  'system'
FROM ejecucion_etapa e
LEFT JOIN lista_pedidos lp ON lp.orden_trabajo_id = e.orden_trabajo_id
WHERE e.fecha_fin IS NOT NULL;

INSERT INTO pedido_orden_trazabilidad_eventos (
  pedido_id,
  orden_trabajo_id,
  tipo_evento,
  evento,
  descripcion,
  estado_key,
  estado_titulo,
  etapa_id,
  etapa_titulo,
  usuario_id,
  created_at,
  metadata,
  origen
)
SELECT
  lp.id,
  qg.orden_trabajo_id,
  CASE
    WHEN lower(COALESCE(qg.resultado_control, '')) LIKE '%aprob%' THEN 'qa_aprobado'
    ELSE 'qa_registrado'
  END,
  CASE
    WHEN lower(COALESCE(qg.resultado_control, '')) LIKE '%aprob%' THEN 'QA aprobado'
    ELSE 'QA registrado'
  END,
  COALESCE(qg.observaciones, 'Registro de control QA'),
  NULL,
  NULL,
  qg.etapa_id,
  qg.etapa_titulo,
  NULL,
  qg.created_at,
  jsonb_build_object(
    'resultado_control', qg.resultado_control,
    'inspector', qg.inspector,
    'intento', qg.intento,
    'estado', qg.estado
  ),
  'system'
FROM qa_gate qg
LEFT JOIN lista_pedidos lp ON lp.orden_trabajo_id = qg.orden_trabajo_id
WHERE qg.created_at IS NOT NULL;

COMMIT;
