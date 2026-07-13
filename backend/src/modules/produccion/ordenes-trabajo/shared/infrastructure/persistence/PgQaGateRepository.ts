/**
 * PgQaGateRepository
 * Gestiona los gates de control de calidad (QA) por etapa.
 */
import { Client } from 'pg';

export interface CreateQaGateInput {
  orden_trabajo_id: number;
  etapa_id: string;
  etapa_titulo?: string | null;
  ejecucion_etapa_id?: number | null;
  created_by?: string | null;
}

export interface UpdateQaGateInput {
  estado?: string | null;
  resultado_control?: string | null;
  inspector?: string | null;
  turno?: string | null;
  maquina_equipo?: string | null;
  unidad_medida?: string | null;
  lote_version_arte?: string | null;
  motivo_no_conformidad?: string | null;
  accion_correctiva?: string | null;
  observaciones?: string | null;
  cierre_qa_responsable?: string | null;
  cierre_qa_fecha?: string | null;
  cierre_qa_hora?: string | null;
  updated_by?: string | null;
}

export class PgQaGateRepository {
  constructor(private readonly client: Client) {}

  async create(input: CreateQaGateInput): Promise<any> {
    // Determinar próximo intento
    const intentoRes = await this.client.query(
      `SELECT COALESCE(MAX(intento),0) AS max_intento FROM qa_gate
       WHERE orden_trabajo_id = $1 AND etapa_id = $2`,
      [input.orden_trabajo_id, input.etapa_id],
    );
    const nuevoIntento = (intentoRes.rows[0]?.max_intento ?? 0) + 1;

    // Buscar ejecución vinculable si no viene explícita
    let ejecucionId = input.ejecucion_etapa_id ?? null;
    if (!ejecucionId) {
      const ejRes = await this.client.query(
        `SELECT id FROM ejecucion_etapa WHERE orden_trabajo_id = $1 AND etapa_id = $2 LIMIT 1`,
        [input.orden_trabajo_id, input.etapa_id],
      );
      ejecucionId = ejRes.rows[0]?.id ?? null;
    }

    const result = await this.client.query(
      `INSERT INTO qa_gate
         (orden_trabajo_id, etapa_id, etapa_titulo, intento, estado, ejecucion_etapa_id, created_by)
       VALUES ($1,$2,$3,$4,'pendiente',$5,$6)
       RETURNING *`,
      [input.orden_trabajo_id, input.etapa_id, input.etapa_titulo ?? null,
       nuevoIntento, ejecucionId, input.created_by ?? null],
    );
    return result.rows[0];
  }

  async update(gateId: number, input: UpdateQaGateInput): Promise<any | null> {
    const result = await this.client.query(
      `UPDATE qa_gate SET
         estado                = COALESCE($1,  estado),
         resultado_control     = COALESCE($2,  resultado_control),
         inspector             = COALESCE($3,  inspector),
         turno                 = COALESCE($4,  turno),
         maquina_equipo        = COALESCE($5,  maquina_equipo),
         unidad_medida         = COALESCE($6,  unidad_medida),
         lote_version_arte     = COALESCE($7,  lote_version_arte),
         motivo_no_conformidad = COALESCE($8,  motivo_no_conformidad),
         accion_correctiva     = COALESCE($9,  accion_correctiva),
         observaciones         = COALESCE($10, observaciones),
         cierre_qa_responsable = COALESCE($11, cierre_qa_responsable),
         cierre_qa_fecha       = COALESCE($12, cierre_qa_fecha),
         cierre_qa_hora        = COALESCE($13, cierre_qa_hora),
         updated_by            = $14
       WHERE id = $15
       RETURNING *`,
      [
        input.estado ?? null, input.resultado_control ?? null, input.inspector ?? null,
        input.turno ?? null, input.maquina_equipo ?? null, input.unidad_medida ?? null,
        input.lote_version_arte ?? null, input.motivo_no_conformidad ?? null,
        input.accion_correctiva ?? null, input.observaciones ?? null,
        input.cierre_qa_responsable ?? null, input.cierre_qa_fecha ?? null,
        input.cierre_qa_hora ?? null, input.updated_by ?? null, gateId,
      ],
    );
    return result.rows[0] ?? null;
  }

  async findByOrden(ordenId: number): Promise<any[]> {
    const result = await this.client.query(
      `SELECT qg.*, ee.operario, ee.datos_etapa, ee.reproceso, ee.observaciones AS obs_operario
       FROM qa_gate qg
       LEFT JOIN ejecucion_etapa ee ON ee.id = qg.ejecucion_etapa_id
       WHERE qg.orden_trabajo_id = $1
       ORDER BY qg.etapa_id, qg.intento`,
      [ordenId],
    );
    return result.rows;
  }

  async getPendientes(): Promise<any[]> {
    const result = await this.client.query(
      `SELECT qg.id AS qa_gate_id, qg.orden_trabajo_id, ot.numero_orden, ot.nombre_cliente,
              qg.etapa_id, qg.etapa_titulo, qg.intento, qg.estado AS estado_qa,
              qg.resultado_control, qg.inspector, qg.turno, qg.maquina_equipo,
              qg.unidad_medida, qg.lote_version_arte, qg.motivo_no_conformidad,
              qg.accion_correctiva, qg.observaciones, qg.cierre_qa_responsable,
              qg.cierre_qa_fecha, qg.cierre_qa_hora, qg.created_at AS ingreso_qa,
              ee.operario, ee.fecha_inicio, ee.hora_inicio, ee.fecha_fin, ee.hora_fin,
              ee.datos_etapa, ee.reproceso, ee.motivo_reproceso, ee.observaciones AS obs_operario
       FROM qa_gate qg
       JOIN orden_trabajo ot ON ot.id = qg.orden_trabajo_id
       LEFT JOIN ejecucion_etapa ee ON ee.id = qg.ejecucion_etapa_id
       WHERE qg.estado = 'pendiente'
       ORDER BY qg.created_at DESC`,
    );
    return result.rows;
  }

  async getEstados(): Promise<any[]> {
    const result = await this.client.query(
      `SELECT DISTINCT ON (orden_trabajo_id, etapa_id)
         orden_trabajo_id, etapa_id, estado, updated_at
       FROM qa_gate
       ORDER BY orden_trabajo_id, etapa_id, updated_at DESC`,
    );
    return result.rows;
  }

  async getHistorial(filters: {
    desde?: string; hasta?: string; estado?: string; inspector?: string;
    etapa_id?: string; numero_orden?: string; page?: number; limit?: number;
  }): Promise<{ historial: any[]; total: number; kpis: any }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["qg.estado <> 'pendiente'"];
    const params: any[] = [];
    let idx = 1;

    if (filters.desde) { conditions.push(`qg.updated_at >= $${idx++}::date`); params.push(filters.desde); }
    if (filters.hasta) { conditions.push(`qg.updated_at < ($${idx++}::date + interval '1 day')`); params.push(filters.hasta); }
    if (filters.estado && ['aprobado','rechazado','condicionado'].includes(filters.estado)) {
      conditions.push(`qg.estado = $${idx++}`); params.push(filters.estado);
    }
    if (filters.inspector) { conditions.push(`qg.inspector ILIKE $${idx++}`); params.push(`%${filters.inspector}%`); }
    if (filters.etapa_id) { conditions.push(`qg.etapa_id = $${idx++}`); params.push(filters.etapa_id); }
    if (filters.numero_orden) { conditions.push(`ot.numero_orden::text ILIKE $${idx++}`); params.push(`%${filters.numero_orden}%`); }

    const where = conditions.join(' AND ');

    const [countRes, dataRes, kpiRes] = await Promise.all([
      this.client.query(`SELECT COUNT(*) AS total FROM qa_gate qg WHERE ${where}`, params),
      this.client.query(
        `SELECT qg.id AS qa_gate_id, qg.orden_trabajo_id, ot.numero_orden, ot.nombre_cliente, ot.tipo_orden,
                qg.etapa_id, qg.etapa_titulo, qg.intento, qg.estado AS estado_qa, qg.resultado_control,
                qg.inspector, qg.turno, qg.maquina_equipo, qg.unidad_medida, qg.lote_version_arte,
                qg.motivo_no_conformidad, qg.accion_correctiva, qg.observaciones,
                qg.cierre_qa_responsable, qg.cierre_qa_fecha, qg.cierre_qa_hora,
                qg.created_at AS ingreso_qa, qg.updated_at AS resolucion_qa,
                EXTRACT(EPOCH FROM (qg.updated_at - qg.created_at)) / 60 AS minutos_resolucion,
                ee.operario, ee.fecha_inicio, ee.hora_inicio, ee.fecha_fin, ee.hora_fin,
                ee.datos_etapa, ee.reproceso, ee.motivo_reproceso, ee.observaciones AS obs_operario,
                qg.updated_by AS resuelto_por
         FROM qa_gate qg
         JOIN orden_trabajo ot ON ot.id = qg.orden_trabajo_id
         LEFT JOIN ejecucion_etapa ee ON ee.id = qg.ejecucion_etapa_id
         WHERE ${where}
         ORDER BY qg.updated_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      ),
      this.client.query(
        `SELECT
           COUNT(*) FILTER (WHERE estado = 'pendiente')    AS pendientes,
           COUNT(*) FILTER (WHERE estado = 'aprobado')     AS aprobados,
           COUNT(*) FILTER (WHERE estado = 'rechazado')    AS rechazados,
           COUNT(*) FILTER (WHERE estado = 'condicionado') AS condicionados,
           ROUND(COUNT(*) FILTER (WHERE estado = 'aprobado') * 100.0
                 / NULLIF(COUNT(*) FILTER (WHERE estado <> 'pendiente'),0), 1) AS tasa_aprobacion,
           ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60)
                 FILTER (WHERE estado <> 'pendiente'), 1) AS avg_minutos_resolucion
         FROM qa_gate
         WHERE created_at >= $1::date`,
        [filters.desde ?? new Date().toISOString().split('T')[0]],
      ),
    ]);

    return {
      historial: dataRes.rows,
      total: parseInt(countRes.rows[0]?.total ?? '0', 10),
      kpis: kpiRes.rows[0] ?? {},
    };
  }
}
