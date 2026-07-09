import { Client } from 'pg';
import { OrdenTrabajoBaseData, CreateOrdenBaseInput } from '../../types';
import { IOrdenCommandRepository } from '../../domain/repositories/IOrdenCommandRepository';
import { NumeroOrden } from '../../domain/value-objects/NumeroOrden';

export class PgOrdenCommandRepository implements IOrdenCommandRepository {
  constructor(private readonly client: Client) {}

  async create(input: CreateOrdenBaseInput): Promise<OrdenTrabajoBaseData> {
    // Obtener el último número
    const lastResult = await this.client.query(
      'SELECT MAX(numero_orden) AS max_numero FROM orden_trabajo'
    );
    
    const lastNumero = lastResult.rows[0]?.max_numero;
    const nuevoNumero = NumeroOrden.generateNext(lastNumero);

    const fields = [
      'numero_orden',
      'tipo_orden',
      'fecha',
      'cliente_id',
      'ruc_id',
      'cotizacion_id',
      'artes_aprobados',
      'observaciones',
      'created_by',
      'created_at',
    ];
    const values: any[] = [
      nuevoNumero.getValue(),
      input.tipo_orden,
      input.fecha,
      input.cliente_id,
      input.ruc_id || null,
      input.cotizacion_id || null,
      input.artes_aprobados || false,
      input.observaciones || null,
      input.created_by,
      new Date(),
    ];

    if (input.estado_orden_digital_id !== undefined) {
      fields.push('estado_orden_digital_id');
      values.push(input.estado_orden_digital_id);
    }
    if (input.estado_orden_offset_id !== undefined) {
      fields.push('estado_orden_offset_id');
      values.push(input.estado_orden_offset_id);
    }

    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const result = await this.client.query(
      `INSERT INTO orden_trabajo (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async update(id: number, data: Partial<OrdenTrabajoBaseData>): Promise<OrdenTrabajoBaseData> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.fecha !== undefined) {
      fields.push(`fecha = $${paramIndex}`);
      values.push(data.fecha);
      paramIndex++;
    }

    if (data.cliente_id !== undefined) {
      fields.push(`cliente_id = $${paramIndex}`);
      values.push(data.cliente_id);
      paramIndex++;
    }

    if (data.ruc_id !== undefined) {
      fields.push(`ruc_id = $${paramIndex}`);
      values.push(data.ruc_id);
      paramIndex++;
    }

    if (data.artes_aprobados !== undefined) {
      fields.push(`artes_aprobados = $${paramIndex}`);
      values.push(data.artes_aprobados);
      paramIndex++;
    }

    if (data.observaciones !== undefined) {
      fields.push(`observaciones = $${paramIndex}`);
      values.push(data.observaciones);
      paramIndex++;
    }

    if (data.updated_by !== undefined) {
      fields.push(`updated_by = $${paramIndex}`);
      values.push(data.updated_by);
      paramIndex++;
    }

    if (data.estado_orden_digital_id !== undefined) {
      fields.push(`estado_orden_digital_id = $${paramIndex}`);
      values.push(data.estado_orden_digital_id);
      paramIndex++;
    }

    if (data.estado_orden_offset_id !== undefined) {
      fields.push(`estado_orden_offset_id = $${paramIndex}`);
      values.push(data.estado_orden_offset_id);
      paramIndex++;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE orden_trabajo 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async delete(id: number): Promise<void> {
    await this.client.query('DELETE FROM orden_trabajo WHERE id = $1', [id]);
  }

  async vincularCotizacion(ordenId: number, cotizacionId: number, updatedBy: number): Promise<void> {
    await this.client.query(
      `UPDATE orden_trabajo 
       SET cotizacion_id = $1, updated_by = $2, updated_at = NOW()
       WHERE id = $3`,
      [cotizacionId, updatedBy, ordenId]
    );
  }

  async aprobarArtes(ordenId: number, updatedBy: number): Promise<void> {
    await this.client.query(
      `UPDATE orden_trabajo 
       SET artes_aprobados = true, updated_by = $1, updated_at = NOW()
       WHERE id = $2`,
      [updatedBy, ordenId]
    );
  }

  async updateFechasProduccion(
    ordenId: number,
    fechaInicio?: Date | null,
    fechaFin?: Date | null
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (fechaInicio !== undefined) {
      fields.push(`fecha_inicio_produccion = $${paramIndex}`);
      values.push(fechaInicio);
      paramIndex++;
    }

    if (fechaFin !== undefined) {
      fields.push(`fecha_fin_produccion = $${paramIndex}`);
      values.push(fechaFin);
      paramIndex++;
    }

    if (fields.length === 0) return;

    fields.push(`updated_at = NOW()`);
    values.push(ordenId);

    await this.client.query(
      `UPDATE orden_trabajo SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }
}
