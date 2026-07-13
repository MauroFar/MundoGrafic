/**
 * PgOrdenLegacyRepository
 * ──────────────────────────────────────────────────────────────────────────
 * Repositorio que trabaja con el esquema real de la tabla orden_trabajo tal
 * como fue construido: nombre_cliente, fecha_creacion, etc.
 * Coexiste con PgOrdenCommandRepository (esquema clean) sin conflicto.
 */
import { Client } from 'pg';
import { IOrdenLegacyRepository } from '../../domain/repositories/IOrdenLegacyRepository';

export interface CreateOrdenLegacyInput {
  nombre_cliente: string;
  orden_compra?: string | null;
  contacto?: string | null;
  email?: string | null;
  telefono?: string | null;
  fecha_creacion?: string | null;
  fecha_entrega?: string | null;
  notas_observaciones?: string | null;
  id_cotizacion?: number | null;
  id_detalle_cotizacion?: number | null;
  tipo_orden: string;
  created_by: number;
  artes_aprobados?: boolean;
  estado_orden_offset_id?: number | null;
  estado_orden_digital_id?: number | null;
}

export interface UpdateOrdenLegacyInput {
  nombre_cliente?: string;
  orden_compra?: string | null;
  contacto?: string | null;
  email?: string | null;
  telefono?: string | null;
  fecha_creacion?: string | null;
  fecha_entrega?: string | null;
  notas_observaciones?: string | null;
  id_detalle_cotizacion?: number | null;
  tipo_orden?: string;
  artes_aprobados?: boolean | null;
  updated_by: number;
  estado_orden_offset_id?: number | null;
  estado_orden_digital_id?: number | null;
  observacion_produccion?: string | null;
  motivo_cancelacion?: string | null;
}

export class PgOrdenLegacyRepository implements IOrdenLegacyRepository {
  constructor(private readonly client: Client) {}

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(input: CreateOrdenLegacyInput): Promise<any> {
    const result = await this.client.query(
      `INSERT INTO orden_trabajo (
         nombre_cliente, orden_compra, contacto, email, telefono,
         fecha_creacion, fecha_entrega, notas_observaciones,
         id_cotizacion, id_detalle_cotizacion, tipo_orden, created_by,
         artes_aprobados, estado_orden_offset_id, estado_orden_digital_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, numero_orden`,
      [
        input.nombre_cliente,
        input.orden_compra ?? null,
        input.contacto ?? null,
        input.email ?? null,
        input.telefono ?? null,
        input.fecha_creacion ?? null,
        input.fecha_entrega ?? null,
        input.notas_observaciones ?? null,
        input.id_cotizacion ?? null,
        input.id_detalle_cotizacion ?? null,
        input.tipo_orden,
        input.created_by,
        input.artes_aprobados ?? false,
        input.estado_orden_offset_id ?? null,
        input.estado_orden_digital_id ?? null,
      ],
    );
    return result.rows[0];
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(id: number, input: UpdateOrdenLegacyInput): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let p = 1;

    const add = (col: string, val: any) => { fields.push(`${col} = $${p++}`); values.push(val); };

    if (input.nombre_cliente !== undefined)        add('nombre_cliente', input.nombre_cliente);
    if (input.orden_compra !== undefined)           add('orden_compra', input.orden_compra);
    if (input.contacto !== undefined)               add('contacto', input.contacto);
    if (input.email !== undefined)                  add('email', input.email);
    if (input.telefono !== undefined)               add('telefono', input.telefono);
    if (input.fecha_creacion !== undefined)         add('fecha_creacion', input.fecha_creacion);
    if (input.fecha_entrega !== undefined)          add('fecha_entrega', input.fecha_entrega);
    if (input.notas_observaciones !== undefined)    add('notas_observaciones', input.notas_observaciones);
    if (input.id_detalle_cotizacion !== undefined)  add('id_detalle_cotizacion', input.id_detalle_cotizacion);
    if (input.tipo_orden !== undefined)             add('tipo_orden', input.tipo_orden);
    if (input.artes_aprobados !== undefined)        add('artes_aprobados', input.artes_aprobados);
    if (input.estado_orden_offset_id !== undefined) add('estado_orden_offset_id', input.estado_orden_offset_id);
    if (input.estado_orden_digital_id !== undefined) add('estado_orden_digital_id', input.estado_orden_digital_id);
    if (input.observacion_produccion !== undefined) add('observacion_produccion', input.observacion_produccion);
    if (input.motivo_cancelacion !== undefined)     add('motivo_cancelacion', input.motivo_cancelacion);

    add('updated_by', input.updated_by);
    fields.push('updated_at = CURRENT_TIMESTAMP');

    values.push(id);
    const result = await this.client.query(
      `UPDATE orden_trabajo SET ${fields.join(', ')} WHERE id = $${p} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  // ─── READ BY ID (completo con trazabilidad) ────────────────────────────────

  async findByIdFull(id: number): Promise<any | null> {
    const result = await this.client.query(
      `SELECT ot.*,
              c.codigo_cotizacion  AS numero_cotizacion,
              cl.telefono_cliente,
              cl.email_cliente,
              cl.direccion_cliente,
              u1.nombre AS created_by_nombre,
              u2.nombre AS updated_by_nombre,
              eod.key   AS estado_digital_key,   eod.titulo AS estado_digital_titulo,
              eoo.key   AS estado_offset_key,    eoo.titulo AS estado_offset_titulo,
              (
                EXISTS (
                  SELECT 1 FROM estado_orden_digital_historial eodh
                  WHERE eodh.orden_trabajo_id = ot.id
                    AND lower(coalesce(eodh.nota,'')) LIKE '%enviad%'
                    AND lower(coalesce(eodh.nota,'')) LIKE '%producci%'
                )
                OR EXISTS (
                  SELECT 1 FROM estado_orden_offset_historial eooh
                  WHERE eooh.orden_trabajo_id = ot.id
                    AND lower(coalesce(eooh.nota,'')) LIKE '%enviad%'
                    AND lower(coalesce(eooh.nota,'')) LIKE '%producci%'
                )
              ) AS enviada_produccion
       FROM orden_trabajo ot
       LEFT JOIN cotizaciones c  ON ot.id_cotizacion = c.id
       LEFT JOIN clientes cl     ON c.cliente_id = cl.id
       LEFT JOIN usuarios u1     ON ot.created_by = u1.id
       LEFT JOIN usuarios u2     ON ot.updated_by = u2.id
       LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
       LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
       WHERE ot.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  async delete(id: number): Promise<boolean> {
    const result = await this.client.query(
      'DELETE FROM orden_trabajo WHERE id = $1 RETURNING id',
      [id],
    );
    return result.rows.length > 0;
  }

  // ─── NEXT NUMBER ──────────────────────────────────────────────────────────

  async getProximoNumero(): Promise<string> {
    const result = await this.client.query(
      `SELECT MAX(numero_orden) AS max_numero FROM orden_trabajo`,
    );
    const maxNumero = result.rows[0].max_numero || 'OT-000000';
    const match = String(maxNumero).match(/OT-(\d+)/);
    const current = match ? parseInt(match[1], 10) : 0;
    return `OT-${String(current + 1).padStart(6, '0')}`;
  }

  // ─── LISTAR CON FILTROS ────────────────────────────────────────────────────

  async listar(filters: {
    busqueda?: string;
    concepto?: string;
    material?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    limite?: number;
    tipo_orden?: string;
    id_cotizacion?: number;
  }): Promise<any[]> {
    let query = `
      SELECT ot.id, ot.numero_orden, ot.nombre_cliente,
             COALESCE(
               (SELECT pod.producto FROM productos_orden_digital pod
                WHERE pod.orden_trabajo_id = ot.id ORDER BY pod.orden ASC LIMIT 1),
               (SELECT poo.concepto FROM productos_orden_offset poo
                WHERE poo.orden_trabajo_id = ot.id ORDER BY poo.orden ASC LIMIT 1)
             ) AS concepto,
             ot.fecha_creacion, ot.tipo_orden, ot.id_cotizacion, ot.artes_aprobados,
             ot.estado_orden_digital_id,
             eod.key   AS estado_digital_key,   eod.titulo AS estado_digital_titulo,
             ot.estado_orden_offset_id,
             eoo.key   AS estado_offset_key,    eoo.titulo AS estado_offset_titulo,
             (
               EXISTS (
                 SELECT 1 FROM estado_orden_digital_historial eodh
                 WHERE eodh.orden_trabajo_id = ot.id
                   AND lower(coalesce(eodh.nota,'')) LIKE '%enviad%'
                   AND lower(coalesce(eodh.nota,'')) LIKE '%producci%'
               )
               OR EXISTS (
                 SELECT 1 FROM estado_orden_offset_historial eooh
                 WHERE eooh.orden_trabajo_id = ot.id
                   AND lower(coalesce(eooh.nota,'')) LIKE '%enviad%'
                   AND lower(coalesce(eooh.nota,'')) LIKE '%producci%'
               )
             ) AS enviada_produccion
      FROM orden_trabajo ot
      LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
      LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
    `;

    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filters.busqueda) {
      where.push(`(CAST(ot.numero_orden AS TEXT) ILIKE $${i} OR ot.nombre_cliente ILIKE $${i})`);
      params.push(`%${filters.busqueda}%`); i++;
    }
    if (filters.concepto) {
      where.push(`(
        EXISTS (SELECT 1 FROM productos_orden_digital pod WHERE pod.orden_trabajo_id = ot.id AND COALESCE(pod.producto,'') ILIKE $${i})
        OR EXISTS (SELECT 1 FROM productos_orden_offset poo WHERE poo.orden_trabajo_id = ot.id AND COALESCE(poo.concepto,'') ILIKE $${i})
      )`);
      params.push(`%${filters.concepto}%`); i++;
    }
    if (filters.material) {
      where.push(`(
        EXISTS (SELECT 1 FROM productos_orden_offset poom WHERE poom.orden_trabajo_id = ot.id
          AND regexp_replace(upper(COALESCE(poom.material,'')), '[[:space:]]+', ' ', 'g')
              LIKE '%' || regexp_replace(upper($${i}), '[[:space:]]+', ' ', 'g') || '%')
        OR EXISTS (SELECT 1 FROM detalle_orden_trabajo_digital dodm WHERE dodm.orden_trabajo_id = ot.id
          AND regexp_replace(upper(COALESCE(dodm.material,'')), '[[:space:]]+', ' ', 'g')
              LIKE '%' || regexp_replace(upper($${i}), '[[:space:]]+', ' ', 'g') || '%')
        OR EXISTS (SELECT 1 FROM detalle_orden_trabajo_offset doom WHERE doom.orden_trabajo_id = ot.id
          AND regexp_replace(upper(COALESCE(doom.material,'')), '[[:space:]]+', ' ', 'g')
              LIKE '%' || regexp_replace(upper($${i}), '[[:space:]]+', ' ', 'g') || '%')
      )`);
      params.push(filters.material); i++;
    }
    if (filters.fechaDesde) { where.push(`fecha_creacion >= $${i}`); params.push(filters.fechaDesde); i++; }
    if (filters.fechaHasta) { where.push(`fecha_creacion <= $${i}`); params.push(filters.fechaHasta); i++; }
    if (filters.tipo_orden) {
      if (filters.tipo_orden.toLowerCase() === 'digital') {
        where.push(`ot.tipo_orden = $${i}`); params.push('digital'); i++;
      } else {
        where.push(`(ot.tipo_orden IS NULL OR ot.tipo_orden <> $${i})`); params.push('digital'); i++;
      }
    }
    if (filters.id_cotizacion) {
      where.push(`ot.id_cotizacion = $${i}`); params.push(filters.id_cotizacion); i++;
    }

    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY ot.id DESC';
    if (filters.limite) { query += ` LIMIT $${i}`; params.push(filters.limite); }

    const result = await this.client.query(query, params);
    return result.rows;
  }

  // ─── ENVIAR A PRODUCCION ───────────────────────────────────────────────────

  async enviarAProduccion(id: number, estadoId: number, tipoOrden: string, observacion: string | null, userId: number | null): Promise<any> {
    const col = tipoOrden === 'digital' ? 'estado_orden_digital_id' : 'estado_orden_offset_id';
    const result = await this.client.query(
      `UPDATE orden_trabajo
         SET ${col} = $1,
             observacion_produccion = $2,
             motivo_cancelacion = NULL,
             updated_by = $3,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [estadoId, observacion, userId, id],
    );
    return result.rows[0] ?? null;
  }

  // ─── APROBAR ARTES ────────────────────────────────────────────────────────

  async aprobarArtes(id: number, fechaEntrega: string, userId: number | null): Promise<any> {
    const result = await this.client.query(
      `UPDATE orden_trabajo
         SET artes_aprobados = TRUE,
             fecha_entrega = $1,
             updated_by = $2,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, numero_orden, artes_aprobados, fecha_entrega, tipo_orden,
                 estado_orden_digital_id, estado_orden_offset_id`,
      [fechaEntrega, userId, id],
    );
    return result.rows[0] ?? null;
  }

  // ─── VINCULAR COTIZACION ──────────────────────────────────────────────────

  async vincularCotizacion(id: number, cotizacionId: number, userId: number | null): Promise<any> {
    const result = await this.client.query(
      `UPDATE orden_trabajo
         SET id_cotizacion = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, numero_orden, id_cotizacion`,
      [cotizacionId, userId, id],
    );
    return result.rows[0] ?? null;
  }

  // ─── CHECK ENVIADA A PRODUCCION ───────────────────────────────────────────

  async fueEnviadaAProduccion(id: number): Promise<boolean> {
    const result = await this.client.query(
      `SELECT (
         EXISTS (
           SELECT 1 FROM estado_orden_digital_historial eodh
           WHERE eodh.orden_trabajo_id = $1
             AND lower(coalesce(eodh.nota,'')) LIKE '%enviad%'
             AND lower(coalesce(eodh.nota,'')) LIKE '%producci%'
         )
         OR EXISTS (
           SELECT 1 FROM estado_orden_offset_historial eooh
           WHERE eooh.orden_trabajo_id = $1
             AND lower(coalesce(eooh.nota,'')) LIKE '%enviad%'
             AND lower(coalesce(eooh.nota,'')) LIKE '%producci%'
         )
       ) AS bloqueada`,
      [id],
    );
    return Boolean(result.rows[0]?.bloqueada);
  }

  // ─── COTIZACIONES VINCULABLES ─────────────────────────────────────────────

  async getCotizacionesVinculables(busqueda?: string, limite: number = 10): Promise<any[]> {
    const params: any[] = [];
    let whereBusqueda = '';
    if (busqueda) {
      params.push(`%${busqueda}%`);
      whereBusqueda = `AND (
        translate(lower(CAST(c.codigo_cotizacion AS TEXT)),'áéíóúüñ','aeiouun') LIKE translate(lower($1),'áéíóúüñ','aeiouun')
        OR translate(lower(cl.nombre_cliente),'áéíóúüñ','aeiouun') LIKE translate(lower($1),'áéíóúüñ','aeiouun')
        OR translate(lower(cl.empresa_cliente),'áéíóúüñ','aeiouun') LIKE translate(lower($1),'áéíóúüñ','aeiouun')
        OR EXISTS (SELECT 1 FROM detalle_cotizacion dc WHERE dc.cotizacion_id = c.id
                   AND translate(lower(dc.detalle),'áéíóúüñ','aeiouun') LIKE translate(lower($1),'áéíóúüñ','aeiouun'))
      )`;
    }
    params.push(Math.min(Math.max(limite, 1), 50));
    const result = await this.client.query(
      `SELECT c.id, c.codigo_cotizacion, c.fecha, c.estado,
              cl.nombre_cliente, cl.empresa_cliente,
              (SELECT detalle FROM detalle_cotizacion WHERE cotizacion_id = c.id ORDER BY id LIMIT 1) AS primer_detalle
       FROM cotizaciones c
       JOIN clientes cl ON c.cliente_id = cl.id
       WHERE 1=1 ${whereBusqueda}
       ORDER BY c.id DESC
       LIMIT $${params.length}`,
      params,
    );
    return result.rows;
  }
}
