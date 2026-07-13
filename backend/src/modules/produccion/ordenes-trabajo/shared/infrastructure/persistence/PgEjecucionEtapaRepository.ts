/**
 * PgEjecucionEtapaRepository
 * Gestiona los registros de ejecución de etapa por operario.
 */
import { Client } from 'pg';

export interface SaveEjecucionInput {
  orden_trabajo_id: number;
  etapa_id: string;
  etapa_titulo?: string | null;
  operario: string;
  fecha_inicio?: string | null;
  hora_inicio?: string | null;
  fecha_fin?: string | null;
  hora_fin?: string | null;
  datos_etapa?: any;
  reproceso?: boolean;
  motivo_reproceso?: string | null;
  observaciones?: string | null;
  created_by?: string | null;
}

export class PgEjecucionEtapaRepository {
  constructor(private readonly client: Client) {}

  async save(input: SaveEjecucionInput): Promise<any> {
    const result = await this.client.query(
      `INSERT INTO ejecucion_etapa
         (orden_trabajo_id, etapa_id, etapa_titulo, operario,
          fecha_inicio, hora_inicio, fecha_fin, hora_fin,
          datos_etapa, reproceso, motivo_reproceso, observaciones, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (orden_trabajo_id, etapa_id)
       DO UPDATE SET
         etapa_titulo     = EXCLUDED.etapa_titulo,
         operario         = EXCLUDED.operario,
         fecha_inicio     = EXCLUDED.fecha_inicio,
         hora_inicio      = EXCLUDED.hora_inicio,
         fecha_fin        = EXCLUDED.fecha_fin,
         hora_fin         = EXCLUDED.hora_fin,
         datos_etapa      = EXCLUDED.datos_etapa,
         reproceso        = EXCLUDED.reproceso,
         motivo_reproceso = EXCLUDED.motivo_reproceso,
         observaciones    = EXCLUDED.observaciones,
         updated_at       = NOW()
       RETURNING *`,
      [
        input.orden_trabajo_id,
        input.etapa_id,
        input.etapa_titulo ?? null,
        input.operario,
        input.fecha_inicio ?? null,
        input.hora_inicio ?? null,
        input.fecha_fin ?? null,
        input.hora_fin ?? null,
        JSON.stringify(input.datos_etapa ?? {}),
        input.reproceso ?? false,
        input.motivo_reproceso ?? null,
        input.observaciones ?? null,
        input.created_by ?? null,
      ],
    );
    return result.rows[0];
  }

  async findByOrden(ordenId: number): Promise<any[]> {
    const result = await this.client.query(
      `SELECT * FROM ejecucion_etapa WHERE orden_trabajo_id = $1 ORDER BY created_at DESC`,
      [ordenId],
    );
    return result.rows;
  }

  async updateFin(ordenId: number, etapaId: string, fechaFin: string, horaFin: string): Promise<any | null> {
    const result = await this.client.query(
      `UPDATE ejecucion_etapa
         SET fecha_fin = $1, hora_fin = $2, updated_at = NOW()
       WHERE orden_trabajo_id = $3 AND etapa_id = $4
       RETURNING *`,
      [fechaFin, horaFin, ordenId, etapaId],
    );
    return result.rows[0] ?? null;
  }
}
