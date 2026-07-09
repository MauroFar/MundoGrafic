import { Client } from 'pg';
import { DetalleOrdenOffsetData, CreateDetalleOffsetInput } from '../../domain/entities/types';

export class PgOrdenOffsetRepository {
  constructor(private readonly client: Client) {}

  async createDetalle(input: CreateDetalleOffsetInput): Promise<DetalleOrdenOffsetData> {
    const result = await this.client.query(
      `INSERT INTO detalle_orden_trabajo_offset (
        orden_trabajo_id, material, impresion, observaciones, corte_material,
        cantidad_pliegos_compra, exceso, pliegos_impresos, tintas_frente, tintas_reverso,
        barniz, terminados, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *`,
      [
        input.orden_trabajo_id,
        input.material || null,
        input.impresion || null,
        input.observaciones || null,
        input.corte_material || null,
        input.cantidad_pliegos_compra || null,
        input.exceso || null,
        input.pliegos_impresos || null,
        input.tintas_frente || null,
        input.tintas_reverso || null,
        input.barniz || null,
        input.terminados || null,
      ]
    );

    return result.rows[0];
  }

  async findDetalleByOrdenId(ordenTrabajoId: number): Promise<DetalleOrdenOffsetData | null> {
    const result = await this.client.query(
      'SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1',
      [ordenTrabajoId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }
}
