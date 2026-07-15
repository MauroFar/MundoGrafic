import { Client } from "pg";
import { RegistroOperarioRepository } from "../../../../domain/repositories/registrosOperario/RegistroOperarioRepository";
import {
  RegistroOperario,
  RegistroOperarioCreateInput,
  RegistroOperarioFilters,
} from "../../../../domain/entities/registrosOperario/RegistroOperario";

export class PgRegistroOperarioRepository implements RegistroOperarioRepository {
  constructor(private readonly client: Client) {}

  async findByFilters(filters: RegistroOperarioFilters): Promise<RegistroOperario[]> {
    const params: any[] = [];
    const where: string[] = [];

    if (filters.fechaDesde) { params.push(filters.fechaDesde); where.push(`fecha >= $${params.length}`); }
    if (filters.fechaHasta) { params.push(filters.fechaHasta); where.push(`fecha <= $${params.length}`); }
    if (filters.operario)   { params.push(`%${filters.operario}%`); where.push(`operario ILIKE $${params.length}`); }
    if (filters.maquina)    { params.push(filters.maquina);   where.push(`maquina = $${params.length}`); }
    if (filters.actividad)  { params.push(filters.actividad); where.push(`actividad = $${params.length}`); }

    const safeLimit = Math.min(Math.max(filters.limit ?? 500, 1), 2000);
    params.push(safeLimit);

    const r = await this.client.query(
      `SELECT id, fecha::text, operario, codigo_operario, cliente, orden_compra,
              lote, producto, cantidad, millares, maquina, actividad,
              tiempo_efectivo_min, tiempo_parado_min, pausas_texto, observaciones,
              ingreso_estimado, created_at, updated_at
       FROM registros_operario
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY fecha DESC, id DESC
       LIMIT $${params.length}`,
      params
    );
    return r.rows;
  }

  async create(input: RegistroOperarioCreateInput): Promise<RegistroOperario> {
    const r = await this.client.query(
      `INSERT INTO registros_operario
         (fecha, operario, codigo_operario, cliente, orden_compra, lote, producto,
          cantidad, millares, maquina, actividad, tiempo_efectivo_min, tiempo_parado_min,
          pausas_texto, observaciones, ingreso_estimado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        input.fecha, input.operario, input.codigo_operario, input.cliente,
        input.orden_compra, input.lote, input.producto, input.cantidad,
        input.millares, input.maquina, input.actividad, input.tiempo_efectivo_min,
        input.tiempo_parado_min, input.pausas_texto ?? null,
        input.observaciones ?? null, input.ingreso_estimado,
      ]
    );
    return r.rows[0];
  }
}
