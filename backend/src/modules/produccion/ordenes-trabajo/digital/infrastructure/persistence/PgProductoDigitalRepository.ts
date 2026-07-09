import { Client } from 'pg';
import { ProductoOrdenDigitalData, CreateProductoDigitalInput } from '../../domain/entities/types';

export class PgProductoDigitalRepository {
  constructor(private readonly client: Client) {}

  async create(input: CreateProductoDigitalInput): Promise<ProductoOrdenDigitalData> {
    const result = await this.client.query(
      `INSERT INTO productos_orden_digital (
        orden_trabajo_id, concepto, cantidad, tamano_abierto, tamano_cerrado,
        material, orden, numero_salida, avance, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [
        input.orden_trabajo_id,
        input.concepto || null,
        input.cantidad || null,
        input.tamano_abierto || null,
        input.tamano_cerrado || null,
        input.material || null,
        input.orden,
        input.numero_salida || null,
        input.avance || null,
      ]
    );
    return result.rows[0];
  }

  async listByOrden(ordenTrabajoId: number): Promise<ProductoOrdenDigitalData[]> {
    const result = await this.client.query(
      'SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden',
      [ordenTrabajoId]
    );
    return result.rows;
  }
}
