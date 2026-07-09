import { Client } from 'pg';

export class CotizacionAuxiliaryRepository {
  constructor(private readonly client: Client) {}

  async getDatosCotizacion(cotizacionId: number): Promise<any> {
    const result = await this.client.query(
      `
        SELECT 
          cl.nombre_cliente AS nombre_cliente,
          cl.empresa_cliente AS empresa_cliente,
          cl.telefono_cliente AS telefono_cliente,
          cl.email_cliente AS email_cliente,
          cl.direccion_cliente AS direccion_cliente,
          c.codigo_cotizacion AS numero_cotizacion,
          c.id AS cotizacion_id
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        WHERE c.id = $1
      `,
      [cotizacionId]
    );
    return result.rows[0] || null;
  }

  async getCotizacionesVinculables(busqueda?: string, limite: number = 10): Promise<any[]> {
    let query = `
      SELECT 
        c.id, 
        c.codigo_cotizacion,
        c.fecha,
        c.estado,
        cl.nombre_cliente,
        cl.empresa_cliente
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.estado = 'aprobada'
    `;
    
    const params: any[] = [];

    if (busqueda && busqueda.trim()) {
      const normalized = `%${busqueda.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(c.codigo_cotizacion) LIKE $1 
        OR LOWER(cl.nombre_cliente) LIKE $1 
        OR LOWER(cl.empresa_cliente) LIKE $1
      )`;
      params.push(normalized);
    }

    query += ` ORDER BY c.fecha DESC LIMIT $${params.length + 1}`;
    params.push(Math.min(Math.max(limite, 1), 50));

    const result = await this.client.query(query, params);
    return result.rows;
  }
}
