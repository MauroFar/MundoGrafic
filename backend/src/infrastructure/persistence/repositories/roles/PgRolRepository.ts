import { Client } from "pg";
import { RolRepository } from "../../../../domain/repositories/roles/RolRepository";
import { Rol, RolCreateInput, RolUpdateInput } from "../../../../domain/entities/roles/Rol";

export class PgRolRepository implements RolRepository {
  constructor(private readonly client: Client) {}

  async findActive(): Promise<Array<Pick<Rol, "id" | "nombre" | "descripcion">>> {
    const result = await this.client.query(
      "SELECT id, nombre, descripcion FROM roles WHERE activo = TRUE ORDER BY nombre",
    );
    return result.rows;
  }

  async findAll(): Promise<Rol[]> {
    const result = await this.client.query(
      "SELECT id, nombre, descripcion, es_sistema, activo, creado_en, actualizado_en FROM roles ORDER BY id",
    );
    return result.rows;
  }

  async findById(id: number): Promise<Rol | null> {
    const result = await this.client.query(
      "SELECT id, nombre, descripcion, es_sistema, activo FROM roles WHERE id = $1",
      [id],
    );
    return result.rows[0] ?? null;
  }

  async create(input: RolCreateInput): Promise<Rol> {
    const result = await this.client.query(
      "INSERT INTO roles (nombre, descripcion, es_sistema, activo) VALUES ($1, $2, FALSE, TRUE) RETURNING id, nombre, descripcion, es_sistema, activo",
      [input.nombre.trim(), (input.descripcion || "").trim()],
    );
    return result.rows[0];
  }

  async update(input: RolUpdateInput): Promise<Rol | null> {
    const result = await this.client.query(
      "UPDATE roles SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), activo = COALESCE($3, activo) WHERE id = $4 RETURNING id, nombre, descripcion, es_sistema, activo",
      [input.nombre?.trim(), input.descripcion?.trim(), input.activo, input.id],
    );
    return result.rows[0] ?? null;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.client.query("UPDATE roles SET activo = FALSE WHERE id = $1", [id]);
    return (result.rowCount || 0) > 0;
  }

  async existsByName(nombre: string, excludeId?: number): Promise<boolean> {
    if (excludeId) {
      const result = await this.client.query(
        "SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND id != $2 LIMIT 1",
        [nombre.trim(), excludeId],
      );
      return result.rows.length > 0;
    }

    const result = await this.client.query(
      "SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) LIMIT 1",
      [nombre.trim()],
    );
    return result.rows.length > 0;
  }

  async countUsersByRol(id: number): Promise<number> {
    const result = await this.client.query(
      "SELECT COUNT(*) as total FROM usuarios WHERE rol_id = $1",
      [id],
    );
    return Number(result.rows[0]?.total || 0);
  }
}
