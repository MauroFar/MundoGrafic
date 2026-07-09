import { Client } from 'pg';
import { DetalleOrdenDigitalData, CreateDetalleDigitalInput } from '../../domain/entities/types';

export class PgOrdenDigitalRepository {
  constructor(private readonly client: Client) {}

  async createDetalle(input: CreateDetalleDigitalInput): Promise<DetalleOrdenDigitalData> {
    const result = await this.client.query(
      `INSERT INTO detalle_orden_trabajo_digital (
        orden_trabajo_id, material, impresion, observaciones, numero_salida,
        adherencia, lote_material, metros_impresos, tintas_frente, tintas_reverso,
        material_reciclado, terminados, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *`,
      [
        input.orden_trabajo_id,
        input.material || null,
        input.impresion || null,
        input.observaciones || null,
        input.numero_salida || null,
        input.adherencia || null,
        input.lote_material || null,
        input.metros_impresos || null,
        input.tintas_frente || null,
        input.tintas_reverso || null,
        input.material_reciclado || false,
        input.terminados || null,
      ]
    );

    return result.rows[0];
  }

  async findDetalleByOrdenId(ordenTrabajoId: number): Promise<DetalleOrdenDigitalData | null> {
    const result = await this.client.query(
      'SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1',
      [ordenTrabajoId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }
}
