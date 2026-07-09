import { Client } from "pg";
import { CotizacionQueryRepository, ListCotizacionesInput } from "../../domain/repositories/CotizacionQueryRepository";

export class PgCotizacionQueryRepository implements CotizacionQueryRepository {
  constructor(private readonly client: Client) {}

  async listCotizaciones(input: ListCotizacionesInput): Promise<any[]> {
    const { busqueda, fechaDesde, fechaHasta, limite, global, userId, userRol } = input;

    let query = `
      SELECT
        c.id,
        c.codigo_cotizacion,
        cl.nombre_cliente,
        cl.empresa_cliente,
        cl.email_cliente,
        c.fecha,
        c.estado,
        c.motivo_rechazo,
        c.observacion_aprobacion,
        c.total,
        r.ruc,
        r.descripcion as ruc_descripcion,
        COALESCE(c.nombre_ejecutivo, TRIM(CONCAT_WS(' ', u.nombre, u.apellido))) AS nombre_ejecutivo,
        c.created_at,
        c.created_by,
        c.updated_by,
        c.updated_at,
        u1.nombre as created_by_nombre,
        u2.nombre as updated_by_nombre,
        (SELECT detalle FROM detalle_cotizacion WHERE cotizacion_id = c.id ORDER BY id LIMIT 1) as primer_detalle,
        (
          SELECT COUNT(*)::int
          FROM orden_trabajo ot
          WHERE ot.id_cotizacion = c.id
        ) AS cantidad_ordenes_relacionadas
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN rucs r ON c.ruc_id = r.id
      JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN usuarios u1 ON c.created_by = u1.id
      LEFT JOIN usuarios u2 ON c.updated_by = u2.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (busqueda) {
      query += ` AND (
        translate(lower(CAST(c.codigo_cotizacion AS TEXT)), 'áéíóúüñ', 'aeiouun') LIKE translate(lower($${paramCount}), 'áéíóúüñ', 'aeiouun')
        OR translate(lower(cl.nombre_cliente), 'áéíóúüñ', 'aeiouun') LIKE translate(lower($${paramCount}), 'áéíóúüñ', 'aeiouun')
        OR translate(lower(cl.empresa_cliente), 'áéíóúüñ', 'aeiouun') LIKE translate(lower($${paramCount}), 'áéíóúüñ', 'aeiouun')
        OR translate(lower(u.nombre), 'áéíóúüñ', 'aeiouun') LIKE translate(lower($${paramCount}), 'áéíóúüñ', 'aeiouun')
        OR EXISTS (
          SELECT 1
          FROM detalle_cotizacion dc
          WHERE dc.cotizacion_id = c.id
            AND translate(lower(dc.detalle), 'áéíóúüñ', 'aeiouun') LIKE translate(lower($${paramCount}), 'áéíóúüñ', 'aeiouun')
        )
      )`;
      params.push(`%${busqueda}%`);
      paramCount += 1;
    }

    if (fechaDesde) {
      query += ` AND DATE(c.fecha) >= DATE($${paramCount})`;
      params.push(fechaDesde);
      paramCount += 1;
    }

    if (fechaHasta) {
      query += ` AND DATE(c.fecha) <= DATE($${paramCount})`;
      params.push(fechaHasta);
      paramCount += 1;
    }

    const isGlobal = !!global;
    if (!isGlobal && userRol === "ejecutivo" && userId) {
      query += ` AND c.usuario_id = $${paramCount}`;
      params.push(userId);
      paramCount += 1;
    }

    query += " ORDER BY c.id DESC";

    if (!busqueda && !fechaDesde && !fechaHasta && !isGlobal) {
      query += ` LIMIT ${limite || 15}`;
    } else if (!isGlobal) {
      query += ` LIMIT ${limite || 15}`;
    }

    const result = await this.client.query(query, params);
    return result.rows;
  }

  async getCotizacionById(id: number): Promise<any | null> {
    const query = `
      SELECT
        c.*,
        cl.nombre_cliente,
        cl.empresa_cliente,
        cl.email_cliente,
        r.ruc,
        r.descripcion as ruc_descripcion,
        COALESCE(c.nombre_ejecutivo, TRIM(CONCAT_WS(' ', u.nombre, u.apellido))) AS nombre_ejecutivo,
        u1.nombre as created_by_nombre,
        u2.nombre as updated_by_nombre
      FROM cotizaciones c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN rucs r ON c.ruc_id = r.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN usuarios u1 ON c.created_by = u1.id
      LEFT JOIN usuarios u2 ON c.updated_by = u2.id
      WHERE c.id = $1
    `;

    const result = await this.client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const detallesQuery = `
      SELECT
        id,
        cotizacion_id,
        cantidad,
        detalle,
        valor_unitario as precio_unitario,
        valor_total as subtotal
      FROM detalle_cotizacion
      WHERE cotizacion_id = $1
      ORDER BY id
    `;

    const detallesResult = await this.client.query(detallesQuery, [id]);

    return {
      ...result.rows[0],
      detalles: detallesResult.rows,
    };
  }
}
