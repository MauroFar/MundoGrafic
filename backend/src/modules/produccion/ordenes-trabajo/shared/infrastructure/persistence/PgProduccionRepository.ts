/**
 * PgProduccionRepository
 * Encapsula todas las queries del módulo de producción:
 * órdenes en producción, workflow, métricas, trazabilidad.
 */
import { Client } from 'pg';

export class PgProduccionRepository {
  constructor(private readonly client: Client) {}

  // ─── ÓRDENES EN PRODUCCIÓN (Kanban) ────────────────────────────────────────

  async getOrdenesEnProduccion(): Promise<any[]> {
    const result = await this.client.query(`
      SELECT
        ot.id, ot.numero_orden, ot.nombre_cliente, ot.contacto,
        ot.email, ot.telefono, ot.fecha_creacion, ot.fecha_entrega,
        eoo.key  AS estado, eoo.key  AS estado_offset_key,  eoo.titulo AS estado_offset_titulo,
        NULL::int    AS estado_orden_digital_id,
        NULL::text   AS estado_digital_key, NULL::text AS estado_digital_titulo,
        ot.estado_orden_offset_id, ot.notas_observaciones,
        dot.vendedor, dot.preprensa, dot.prensa, dot.terminados, dot.facturado,
        ot.id_cotizacion, ot.tipo_orden, dot.material, dot.corte_material,
        dot.cantidad_pliegos_compra, dot.exceso, dot.total_pliegos,
        NULL::text AS lote_material, NULL::text AS lote_produccion,
        dot.tamano, dot.tamano_abierto_1, dot.tamano_cerrado_1,
        dot.impresion, dot.instrucciones_impresion, dot.instrucciones_acabados,
        dot.instrucciones_empacado, dot.observaciones, NULL::text AS prensa_seleccionada,
        (SELECT concepto FROM productos_orden_offset WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS concepto,
        (SELECT cantidad::text FROM productos_orden_offset WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS cantidad,
        ot.created_at, ot.updated_at
      FROM orden_trabajo ot
      LEFT JOIN detalle_orden_trabajo_offset dot ON ot.id = dot.orden_trabajo_id
      LEFT JOIN estado_orden_offset eoo ON ot.estado_orden_offset_id = eoo.id
      WHERE (ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital')
        AND EXISTS (
          SELECT 1 FROM estado_orden_offset_historial eooh
          WHERE eooh.orden_trabajo_id = ot.id
            AND lower(coalesce(eooh.nota,'')) LIKE '%enviad%'
            AND lower(coalesce(eooh.nota,'')) LIKE '%producci%'
        )

      UNION ALL

      SELECT
        ot.id, ot.numero_orden, ot.nombre_cliente, ot.contacto,
        ot.email, ot.telefono, ot.fecha_creacion, ot.fecha_entrega,
        eod.key  AS estado, NULL::text AS estado_offset_key, NULL::text AS estado_offset_titulo,
        ot.estado_orden_digital_id,
        eod.key  AS estado_digital_key, eod.titulo AS estado_digital_titulo,
        NULL::int AS estado_orden_offset_id, ot.notas_observaciones,
        dtd.vendedor, dtd.preprensa, dtd.prensa, dtd.terminados, dtd.facturado,
        ot.id_cotizacion, ot.tipo_orden, dtd.material,
        NULL::text AS corte_material, NULL::varchar AS cantidad_pliegos_compra,
        NULL::varchar AS exceso, NULL::varchar AS total_pliegos,
        dtd.lote_material, dtd.lote_produccion,
        NULL::text AS tamano, NULL::text AS tamano_abierto_1, NULL::text AS tamano_cerrado_1,
        dtd.impresion, NULL::text AS instrucciones_impresion,
        NULL::text AS instrucciones_acabados, NULL::text AS instrucciones_empacado,
        dtd.observaciones, NULL::text AS prensa_seleccionada,
        (SELECT producto FROM productos_orden_digital WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS concepto,
        (SELECT cantidad  FROM productos_orden_digital WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS cantidad,
        ot.created_at, ot.updated_at
      FROM orden_trabajo ot
      LEFT JOIN detalle_orden_trabajo_digital dtd ON ot.id = dtd.orden_trabajo_id
      LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
      WHERE ot.tipo_orden = 'digital'
        AND EXISTS (
          SELECT 1 FROM estado_orden_digital_historial eodh
          WHERE eodh.orden_trabajo_id = ot.id
            AND lower(coalesce(eodh.nota,'')) LIKE '%enviad%'
            AND lower(coalesce(eodh.nota,'')) LIKE '%producci%'
        )
      ORDER BY fecha_entrega ASC NULLS LAST, created_at DESC
    `);
    return result.rows;
  }

  // ─── WORKFLOW ─────────────────────────────────────────────────────────────

  async getWorkflowDigital(): Promise<any[]> {
    const result = await this.client.query(
      `SELECT id, key, titulo, orden, color, activo
       FROM estado_orden_digital
       WHERE activo = TRUE AND key <> 'pendiente'
       ORDER BY orden ASC`,
    );
    return result.rows;
  }

  getWorkflowOffset(): any[] {
    return [
      { id: 'preprensa',          db_estado: 'en_preprensa', titulo: 'Pre prensa',          color: 'blue',    aliases: ['preprensa','pre prensa','en preprensa','en_preprensa'] },
      { id: 'guillotinado',       db_estado: 'en_preprensa', titulo: 'Guillotinado',         color: 'indigo',  aliases: ['guillotinado','guillotina'] },
      { id: 'prensa',             db_estado: 'en_prensa',    titulo: 'Prensa',               color: 'purple',  aliases: ['prensa','impresion','impresión','en_prensa','en prensa'] },
      { id: 'barnizado',          db_estado: 'terminados',   titulo: 'Barnizado',            color: 'orange',  aliases: ['barnizado'] },
      { id: 'plastificado',       db_estado: 'terminados',   titulo: 'Plastificado',         color: 'teal',    aliases: ['plastificado','laminado'] },
      { id: 'troquelado',         db_estado: 'terminados',   titulo: 'Troquelado',           color: 'cyan',    aliases: ['troquelado','troquel'] },
      { id: 'pegado',             db_estado: 'terminados',   titulo: 'Pegado',               color: 'emerald', aliases: ['pegado'] },
      { id: 'terminados_mg',      db_estado: 'terminados',   titulo: 'Terminados MG',        color: 'yellow',  aliases: ['terminados mg','terminado mg','terminados','terminado'] },
      { id: 'terminados_externos',db_estado: 'terminados',   titulo: 'Terminados externos',  color: 'gray',    aliases: ['terminados externos','terminado externo'] },
      { id: 'entregado',          db_estado: 'entregado',    titulo: 'Entregado',            color: 'green',   aliases: ['entregado','completado','facturado'] },
    ];
  }

  // ─── MÉTRICAS ─────────────────────────────────────────────────────────────

  async getMetricas(): Promise<any> {
    const [terminalOffset, terminalDigital, pendienteRes] = await Promise.all([
      this.client.query(`SELECT id FROM estado_orden_offset WHERE key IN ('entregado','facturado')`),
      this.client.query(`SELECT id FROM estado_orden_digital WHERE key IN ('entregado','facturado','liberado')`),
      this.client.query(`SELECT id FROM estado_orden_offset WHERE key = 'pendiente' LIMIT 1`),
    ]);

    const idsTO = terminalOffset.rows.map((r: any) => r.id);
    const idsTD = terminalDigital.rows.map((r: any) => r.id);
    const pendienteId = pendienteRes.rows[0]?.id;

    const notTO = idsTO.length ? `(estado_orden_offset_id IS NULL OR estado_orden_offset_id NOT IN (${idsTO.join(',')}))` : 'TRUE';
    const notTD = idsTD.length ? `estado_orden_digital_id NOT IN (${idsTD.join(',')})` : 'TRUE';

    const envCond = `(
      EXISTS (SELECT 1 FROM estado_orden_digital_historial eodh WHERE eodh.orden_trabajo_id = ot.id AND lower(coalesce(eodh.nota,'')) LIKE '%enviad%' AND lower(coalesce(eodh.nota,'')) LIKE '%producci%')
      OR EXISTS (SELECT 1 FROM estado_orden_offset_historial eooh WHERE eooh.orden_trabajo_id = ot.id AND lower(coalesce(eooh.nota,'')) LIKE '%enviad%' AND lower(coalesce(eooh.nota,'')) LIKE '%producci%')
    )`;
    const activeOffset = `(ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND ${notTO}`;
    const activeDigital = `ot.tipo_orden = 'digital' AND ${notTD}`;

    const [total, pendientes, enProceso, retrasadas, completadasHoy, hoy, semana, distribucion, promedio] =
      await Promise.all([
        this.client.query(`SELECT COUNT(*) AS total FROM orden_trabajo ot WHERE ${envCond} AND ((${activeOffset}) OR (${activeDigital}))`),
        this.client.query(`SELECT COUNT(*) AS total FROM orden_trabajo ot WHERE ${envCond} AND ((ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND (ot.estado_orden_offset_id IS NULL OR ot.estado_orden_offset_id = $1))`, [pendienteId]),
        this.client.query(`SELECT COUNT(*) AS total FROM orden_trabajo ot WHERE ${envCond} AND (((ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND ot.estado_orden_offset_id IS NOT NULL AND ${notTO}) OR (ot.tipo_orden = 'digital' AND ot.estado_orden_digital_id IS NOT NULL AND ${notTD}))`),
        this.client.query(`SELECT COUNT(*) AS total FROM orden_trabajo ot WHERE ${envCond} AND fecha_entrega < CURRENT_DATE AND ((${activeOffset}) OR (${activeDigital}))`),
        this.client.query(`SELECT COUNT(*) AS total FROM orden_trabajo ot WHERE ${envCond} AND DATE(ot.updated_at) = CURRENT_DATE AND (((ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND ot.estado_orden_offset_id IN (${idsTO.length ? idsTO.join(',') : 'NULL'})) OR (ot.tipo_orden = 'digital' AND ot.estado_orden_digital_id IN (${idsTD.length ? idsTD.join(',') : 'NULL'})))`),
        this.client.query(`SELECT COUNT(*) AS total FROM orden_trabajo ot WHERE ${envCond} AND fecha_entrega = CURRENT_DATE AND ((${activeOffset}) OR (${activeDigital}))`),
        this.client.query(`SELECT COUNT(*) AS total FROM orden_trabajo ot WHERE ${envCond} AND fecha_entrega BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND ((${activeOffset}) OR (${activeDigital}))`),
        this.client.query(`SELECT COALESCE(eoo.titulo, eod.titulo,'Sin estado') AS estado, COUNT(*) AS cantidad FROM orden_trabajo ot LEFT JOIN estado_orden_offset eoo ON ot.estado_orden_offset_id = eoo.id LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id WHERE ${envCond} GROUP BY COALESCE(eoo.titulo,eod.titulo,'Sin estado') ORDER BY cantidad DESC`),
        this.client.query(`SELECT AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))) AS promedio_dias FROM orden_trabajo ot WHERE ${envCond} AND ((${activeOffset}) OR (${activeDigital}))`),
      ]);

    return {
      totalOrdenes: parseInt(total.rows[0].total),
      pendientes: parseInt(pendientes.rows[0].total),
      enProceso: parseInt(enProceso.rows[0].total),
      retrasadas: parseInt(retrasadas.rows[0].total),
      completadasHoy: parseInt(completadasHoy.rows[0].total),
      porEntregarHoy: parseInt(hoy.rows[0].total),
      porEntregarSemana: parseInt(semana.rows[0].total),
      distribucionEstados: distribucion.rows,
      promedioDiasProduccion: parseFloat(promedio.rows[0].promedio_dias || 0).toFixed(1),
    };
  }

  // ─── ACTIVIDADES RECIENTES ─────────────────────────────────────────────────

  async getActividades(limit: number = 10): Promise<any[]> {
    const result = await this.client.query(
      `SELECT ot.id, ot.numero_orden, ot.tipo_orden, ot.updated_at,
              COALESCE(eod.titulo, eoo.titulo, 'Sin estado') AS estado,
              COALESCE(eod.key, eoo.key) AS estado_key
       FROM orden_trabajo ot
       LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
       LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
       ORDER BY ot.updated_at DESC
       LIMIT $1`,
      [Math.max(1, Math.min(50, limit))],
    );
    return result.rows;
  }

  // ─── TRAZABILIDAD COMPLETA ────────────────────────────────────────────────

  async getTrazabilidad(ordenId: number): Promise<any> {
    const [ordenRes, ejecRes, gatesRes] = await Promise.all([
      this.client.query(
        `SELECT ot.id, ot.numero_orden, ot.nombre_cliente, ot.notas_observaciones,
                ot.tipo_orden, ot.fecha_entrega, ot.created_at,
                eod.key AS estado_digital_key,  eod.titulo AS estado_digital_titulo,
                eoo.key AS estado_offset_key,   eoo.titulo AS estado_offset_titulo
         FROM orden_trabajo ot
         LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
         LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
         WHERE ot.id = $1`,
        [ordenId],
      ),
      this.client.query(
        `SELECT id, etapa_id, etapa_titulo, operario, fecha_inicio, hora_inicio,
                fecha_fin, hora_fin, datos_etapa, reproceso, motivo_reproceso,
                observaciones, created_at, updated_at, created_by
         FROM ejecucion_etapa WHERE orden_trabajo_id = $1 ORDER BY created_at ASC`,
        [ordenId],
      ),
      this.client.query(
        `SELECT qg.id, qg.etapa_id, qg.etapa_titulo, qg.intento, qg.estado,
                qg.resultado_control, qg.inspector, qg.turno, qg.maquina_equipo,
                qg.unidad_medida, qg.lote_version_arte, qg.motivo_no_conformidad,
                qg.accion_correctiva, qg.observaciones, qg.cierre_qa_responsable,
                qg.cierre_qa_fecha, qg.cierre_qa_hora, qg.created_at, qg.updated_at
         FROM qa_gate qg WHERE qg.orden_trabajo_id = $1
         ORDER BY qg.etapa_id, qg.intento ASC`,
        [ordenId],
      ),
    ]);

    if (!ordenRes.rows.length) return null;

    const etapasMap = new Map<string, any>();
    for (const e of ejecRes.rows) {
      etapasMap.set(e.etapa_id, { etapa_id: e.etapa_id, etapa_titulo: e.etapa_titulo, ejecucion: e, qa_gates: [] });
    }
    for (const g of gatesRes.rows) {
      if (!etapasMap.has(g.etapa_id)) {
        etapasMap.set(g.etapa_id, { etapa_id: g.etapa_id, etapa_titulo: g.etapa_titulo, ejecucion: null, qa_gates: [] });
      }
      etapasMap.get(g.etapa_id).qa_gates.push(g);
    }

    return { orden: ordenRes.rows[0], etapas: Array.from(etapasMap.values()) };
  }
}
