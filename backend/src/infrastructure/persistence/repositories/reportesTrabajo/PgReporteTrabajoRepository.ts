import { Client } from "pg";
import { ReporteTrabajoRepository } from "../../../../domain/repositories/reportesTrabajo/ReporteTrabajoRepository";
import {
  ReporteTrabajo,
  ReporteTrabajoCreateInput,
  ReporteTrabajoFilters,
  ReporteFechaItem,
} from "../../../../domain/entities/reportesTrabajo/ReporteTrabajo";

export class PgReporteTrabajoRepository implements ReporteTrabajoRepository {
  constructor(private readonly client: Client) {}

  async findByFilters(filters: ReporteTrabajoFilters): Promise<ReporteTrabajo[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.area_id)     { params.push(filters.area_id);     conditions.push(`r.area_id = $${params.length}`); }
    if (filters.operador_id) { params.push(filters.operador_id); conditions.push(`r.usuario_id = $${params.length}`); }
    if (filters.fecha) {
      params.push(filters.fecha); conditions.push(`r.fecha = $${params.length}`);
    } else {
      if (filters.fecha_desde) { params.push(filters.fecha_desde); conditions.push(`r.fecha >= $${params.length}`); }
      if (filters.fecha_hasta) { params.push(filters.fecha_hasta); conditions.push(`r.fecha <= $${params.length}`); }
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const r = await this.client.query(
      `SELECT r.id, r.area_id, a.nombre AS area,
              r.usuario_id AS operador_id,
              TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS operador,
              r.proceso, r.solicitado_por,
              to_char(r.inicio, 'HH24:MI') AS inicio,
              to_char(r.fin,   'HH24:MI') AS fin,
              r.fecha, r.created_at
       FROM reportes_trabajo_diario r
       JOIN areas a ON a.id = r.area_id
       JOIN usuarios u ON u.id = r.usuario_id
       ${where}
       ORDER BY r.fecha DESC, u.nombre ASC, r.inicio ASC`,
      params
    );
    return r.rows;
  }

  async findById(id: number): Promise<ReporteTrabajo | null> {
    const r = await this.client.query(
      `SELECT r.id, r.area_id, a.nombre AS area,
              r.usuario_id AS operador_id,
              TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS operador,
              r.proceso, r.solicitado_por,
              to_char(r.inicio, 'HH24:MI') AS inicio,
              to_char(r.fin,   'HH24:MI') AS fin,
              r.fecha
       FROM reportes_trabajo_diario r
       JOIN areas a ON a.id = r.area_id
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.id = $1`,
      [id]
    );
    return r.rows[0] ?? null;
  }

  async create(input: ReporteTrabajoCreateInput): Promise<ReporteTrabajo> {
    const r = await this.client.query(
      `INSERT INTO reportes_trabajo_diario
         (area_id, usuario_id, proceso, solicitado_por, inicio, fin, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, area_id, usuario_id, proceso, solicitado_por,
                 to_char(inicio, 'HH24:MI') AS inicio,
                 to_char(fin,   'HH24:MI') AS fin,
                 fecha, created_at`,
      [
        input.area_id, input.usuario_id, input.proceso,
        input.solicitado_por ?? null, input.inicio, input.fin, input.fecha,
      ]
    );
    return r.rows[0];
  }

  async update(id: number, input: ReporteTrabajoCreateInput): Promise<ReporteTrabajo | null> {
    const r = await this.client.query(
      `UPDATE reportes_trabajo_diario
       SET area_id=$1, usuario_id=$2, proceso=$3, solicitado_por=$4, inicio=$5, fin=$6, fecha=$7
       WHERE id=$8
       RETURNING id, area_id, usuario_id, proceso, solicitado_por,
                 to_char(inicio, 'HH24:MI') AS inicio,
                 to_char(fin,   'HH24:MI') AS fin,
                 fecha, created_at`,
      [
        input.area_id, input.usuario_id, input.proceso,
        input.solicitado_por ?? null, input.inicio, input.fin, input.fecha, id,
      ]
    );
    return r.rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const r = await this.client.query(
      "DELETE FROM reportes_trabajo_diario WHERE id=$1 RETURNING id",
      [id]
    );
    return r.rows.length > 0;
  }

  async findFechasByOperador(
    operador_id: number,
    filters: { area_id?: number; fecha_desde?: string; fecha_hasta?: string }
  ): Promise<ReporteFechaItem[]> {
    const params: any[] = [operador_id];
    const extra: string[] = [];
    if (filters.area_id)     { params.push(filters.area_id);     extra.push(`AND r.area_id = $${params.length}`); }
    if (filters.fecha_desde) { params.push(filters.fecha_desde); extra.push(`AND r.fecha >= $${params.length}`); }
    if (filters.fecha_hasta) { params.push(filters.fecha_hasta); extra.push(`AND r.fecha <= $${params.length}`); }

    const r = await this.client.query(
      `SELECT r.fecha::text AS fecha,
              TO_CHAR(r.fecha, 'Day') AS dia_semana_raw,
              COUNT(*)::int AS total
       FROM reportes_trabajo_diario r
       WHERE r.usuario_id = $1 ${extra.join("\n")}
       GROUP BY r.fecha
       ORDER BY r.fecha DESC`,
      params
    );
    return r.rows;
  }

  async getContextoUsuario(userId: number) {
    const r = await this.client.query(
      `SELECT u.id AS operador_id,
              TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS operador,
              a.id AS area_id, a.nombre AS area
       FROM usuarios u
       LEFT JOIN areas a ON a.id = u.area_id
       WHERE u.id = $1 AND u.activo = true
       LIMIT 1`,
      [userId]
    );
    return r.rows[0] ?? null;
  }

  async getCatalogos() {
    const [areas, operadores] = await Promise.all([
      this.client.query(
        "SELECT id, nombre, activo FROM areas WHERE activo = true ORDER BY nombre ASC"
      ),
      this.client.query(
        `SELECT id, nombre, apellido,
                TRIM(CONCAT_WS(' ', nombre, apellido)) AS nombre_completo,
                area_id, activo
         FROM usuarios
         WHERE activo = true AND area_id IS NOT NULL
         ORDER BY nombre ASC, apellido ASC`
      ),
    ]);
    return { areas: areas.rows, operadores: operadores.rows };
  }
}
