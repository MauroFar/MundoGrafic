import { Client } from 'pg';
import { EstadoOrdenOffsetData, EstadoOrdenOffsetHistorialData } from '../../domain/entities/types';

export class PgEstadoOrdenOffsetRepository {
  constructor(private readonly client: Client) {}

  async getActiveStates(): Promise<EstadoOrdenOffsetData[]> {
    const result = await this.client.query(
      'SELECT id, key, titulo, orden, color, activo, created_at, updated_at FROM estado_orden_offset WHERE activo = TRUE ORDER BY orden'
    );
    return result.rows;
  }

  async getStateById(id: number): Promise<EstadoOrdenOffsetData | null> {
    const result = await this.client.query(
      'SELECT id, key, titulo, orden, color, activo, created_at, updated_at FROM estado_orden_offset WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getStateByKey(key: string): Promise<EstadoOrdenOffsetData | null> {
    const normalized = key.toString().trim().toLowerCase();
    const result = await this.client.query(
      'SELECT id, key, titulo, orden, color, activo, created_at, updated_at FROM estado_orden_offset WHERE activo = TRUE AND lower(key) = $1 LIMIT 1',
      [normalized]
    );
    return result.rows[0] || null;
  }

  async findStateByKeyOrTitle(value: string): Promise<EstadoOrdenOffsetData | null> {
    const normalized = value.toString().trim().toLowerCase();
    const result = await this.client.query(
      'SELECT id, key, titulo, orden, color, activo, created_at, updated_at FROM estado_orden_offset WHERE activo = TRUE'
    );
    return result.rows.find((row: any) => {
      const key = String(row.key || '').toLowerCase();
      const titulo = String(row.titulo || '').toLowerCase();
      return key === normalized || titulo === normalized || key.includes(normalized) || titulo.includes(normalized);
    }) || null;
  }

  async getPendingStateId(): Promise<number | null> {
    const result = await this.client.query(
      "SELECT id FROM estado_orden_offset WHERE key = 'pendiente' LIMIT 1"
    );
    return result.rows[0]?.id ?? null;
  }

  async getHistoryByOrdenId(ordenTrabajoId: number): Promise<EstadoOrdenOffsetHistorialData[]> {
    const result = await this.client.query(
      'SELECT id, orden_trabajo_id, estado_id, usuario_id, fecha_cambio, nota, created_at FROM estado_orden_offset_historial WHERE orden_trabajo_id = $1 ORDER BY fecha_cambio ASC',
      [ordenTrabajoId]
    );
    return result.rows;
  }

  async updateOrdenState(ordenTrabajoId: number, estadoId: number): Promise<void> {
    await this.client.query(
      'UPDATE orden_trabajo SET estado_orden_offset_id = $1, updated_at = NOW() WHERE id = $2',
      [estadoId, ordenTrabajoId]
    );
  }

  async createHistory(ordenTrabajoId: number, estadoId: number, usuarioId: number | null, nota?: string | null): Promise<void> {
    await this.client.query(
      'INSERT INTO estado_orden_offset_historial (orden_trabajo_id, estado_id, usuario_id, fecha_cambio, nota, created_at) VALUES ($1, $2, $3, NOW(), $4, NOW())',
      [ordenTrabajoId, estadoId, usuarioId, nota || null]
    );
  }
}

