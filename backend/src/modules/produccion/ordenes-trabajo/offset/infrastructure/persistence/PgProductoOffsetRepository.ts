import { Client } from 'pg';
import { ProductoOrdenOffsetData, CreateProductoOffsetInput } from '../../domain/entities/types';

export class PgProductoOffsetRepository {
  constructor(private readonly client: Client) {}

  async create(input: CreateProductoOffsetInput): Promise<ProductoOrdenOffsetData> {
    const result = await this.client.query(
      `INSERT INTO productos_orden_offset (
        orden_trabajo_id, concepto, cantidad, tamano_abierto, tamano_cerrado,
        material, orden, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [
        input.orden_trabajo_id,
        input.concepto || null,
        input.cantidad || null,
        input.tamano_abierto || null,
        input.tamano_cerrado || null,
        input.material || null,
        input.orden,
      ]
    );
    return result.rows[0];
  }

  async listByOrden(ordenTrabajoId: number): Promise<ProductoOrdenOffsetData[]> {
    const result = await this.client.query(
      'SELECT * FROM productos_orden_offset WHERE orden_trabajo_id = $1 ORDER BY orden',
      [ordenTrabajoId]
    );
    return result.rows;
  }
}
