import { Client } from "pg";
import { PrensaRepository } from "../../../../domain/repositories/prensas/PrensaRepository";
import { Prensa, PrensaCreateInput, PrensaUpdateInput } from "../../../../domain/entities/prensas/Prensa";

export class PgPrensaRepository implements PrensaRepository {
  constructor(private readonly client: Client) {}

  async findAllActive(): Promise<Prensa[]> {
    const r = await this.client.query(
      "SELECT id, nombre, descripcion, activo FROM prensas WHERE activo = true ORDER BY nombre"
    );
    return r.rows;
  }

  async findAll(): Promise<Prensa[]> {
    const r = await this.client.query(
      "SELECT id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion FROM prensas ORDER BY nombre"
    );
    return r.rows;
  }

  async findById(id: number): Promise<Prensa | null> {
    const r = await this.client.query(
      "SELECT id, nombre, descripcion, activo FROM prensas WHERE id = $1",
      [id]
    );
    return r.rows[0] ?? null;
  }

  async existsByNombre(nombre: string, excludeId?: number): Promise<boolean> {
    const r = excludeId
      ? await this.client.query(
          "SELECT 1 FROM prensas WHERE LOWER(nombre) = LOWER($1) AND id != $2",
          [nombre, excludeId]
        )
      : await this.client.query(
          "SELECT 1 FROM prensas WHERE LOWER(nombre) = LOWER($1)",
          [nombre]
        );
    return r.rows.length > 0;
  }

  async create(input: PrensaCreateInput): Promise<Prensa> {
    const r = await this.client.query(
      "INSERT INTO prensas (nombre, descripcion, activo) VALUES ($1, $2, true) RETURNING id, nombre, descripcion, activo",
      [input.nombre, input.descripcion ?? null]
    );
    return r.rows[0];
  }

  async update(input: PrensaUpdateInput): Promise<Prensa | null> {
    const r = await this.client.query(
      "UPDATE prensas SET nombre = $1, descripcion = $2, activo = $3 WHERE id = $4 RETURNING id, nombre, descripcion, activo",
      [input.nombre, input.descripcion ?? null, input.activo ?? true, input.id]
    );
    return r.rows[0] ?? null;
  }

  async deactivate(id: number): Promise<Prensa | null> {
    const r = await this.client.query(
      "UPDATE prensas SET activo = false WHERE id = $1 RETURNING id, nombre, descripcion, activo",
      [id]
    );
    return r.rows[0] ?? null;
  }
}
