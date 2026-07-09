import { Client } from 'pg';
import { OrdenTrabajoBase } from '../../domain/entities/OrdenTrabajoBase';
import { OrdenSearchFilters, OrdenTrabajoBaseData } from '../../types';
import { IOrdenQueryRepository } from '../../domain/repositories/IOrdenQueryRepository';

export class PgOrdenQueryRepository implements IOrdenQueryRepository {
  constructor(private readonly client: Client) {}

  async findByFilters(filters: OrdenSearchFilters): Promise<OrdenTrabajoBase[]> {
    let query = `
      SELECT ot.*, 
             c.nombre_cliente, c.empresa_cliente,
             cot.codigo_cotizacion as numero_cotizacion
      FROM orden_trabajo ot
      LEFT JOIN clientes c ON c.id = ot.cliente_id
      LEFT JOIN cotizaciones cot ON cot.id = ot.cotizacion_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.tipo_orden) {
      query += ` AND ot.tipo_orden = $${paramIndex}`;
      params.push(filters.tipo_orden);
      paramIndex++;
    }

    if (filters.numero_orden) {
      query += ` AND ot.numero_orden ILIKE $${paramIndex}`;
      params.push(`%${filters.numero_orden}%`);
      paramIndex++;
    }

    if (filters.cliente_id) {
      query += ` AND ot.cliente_id = $${paramIndex}`;
      params.push(filters.cliente_id);
      paramIndex++;
    }

    if (filters.ruc_id) {
      query += ` AND ot.ruc_id = $${paramIndex}`;
      params.push(filters.ruc_id);
      paramIndex++;
    }

    if (filters.busqueda) {
      const busqueda = `%${String(filters.busqueda).trim()}%`;
      query += ` AND (
        ot.numero_orden ILIKE $${paramIndex}
        OR c.nombre_cliente ILIKE $${paramIndex}
        OR c.empresa_cliente ILIKE $${paramIndex}
        OR cot.codigo_cotizacion ILIKE $${paramIndex}
        OR ot.observaciones ILIKE $${paramIndex}
      )`;
      params.push(busqueda);
      paramIndex++;
    }

    if (filters.fecha_desde) {
      query += ` AND ot.fecha >= $${paramIndex}`;
      params.push(filters.fecha_desde);
      paramIndex++;
    }

    if (filters.fecha_hasta) {
      query += ` AND ot.fecha <= $${paramIndex}`;
      params.push(filters.fecha_hasta);
      paramIndex++;
    }

    if (filters.artes_aprobados !== undefined) {
      query += ` AND ot.artes_aprobados = $${paramIndex}`;
      params.push(filters.artes_aprobados);
      paramIndex++;
    }

    query += ` ORDER BY ot.fecha DESC, ot.numero_orden DESC`;

    const result = await this.client.query(query, params);
    return result.rows.map(row => new OrdenTrabajoBase(row));
  }

  async findById(id: number): Promise<OrdenTrabajoBase | null> {
    const result = await this.client.query(
      'SELECT * FROM orden_trabajo WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) return null;
    return new OrdenTrabajoBase(result.rows[0]);
  }

  async findByNumero(numeroOrden: string): Promise<OrdenTrabajoBase | null> {
    const result = await this.client.query(
      'SELECT * FROM orden_trabajo WHERE numero_orden = $1',
      [numeroOrden]
    );
    
    if (result.rows.length === 0) return null;
    return new OrdenTrabajoBase(result.rows[0]);
  }

  async getLastNumeroOrden(): Promise<string | null> {
    const result = await this.client.query(
      'SELECT MAX(numero_orden) AS max_numero FROM orden_trabajo'
    );
    
    return result.rows[0]?.max_numero || null;
  }

  async exists(id: number): Promise<boolean> {
    const result = await this.client.query(
      'SELECT 1 FROM orden_trabajo WHERE id = $1',
      [id]
    );
    
    return result.rows.length > 0;
  }
}
