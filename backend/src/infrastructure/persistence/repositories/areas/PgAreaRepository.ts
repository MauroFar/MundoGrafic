import { Client } from "pg";
import { AreaRepository } from "../../../../domain/repositories/areas/AreaRepository";
import { Area, AreaCreateInput, AreaUpdateInput } from "../../../../domain/entities/areas/Area";

export class PgAreaRepository implements AreaRepository {
  constructor(private readonly client: Client) {}

  async findActive(): Promise<Array<Pick<Area, "id" | "nombre" | "descripcion">>> {
    const result = await this.client.query(
      "SELECT id, nombre, descripcion FROM areas WHERE activo = TRUE ORDER BY nombre",
    );
    return result.rows;
  }

  async findAll(): Promise<Area[]> {
    const result = await this.client.query(
      "SELECT id, nombre, descripcion, activo, creado_en, actualizado_en FROM areas ORDER BY id",
    );
    return result.rows;
  }

  async findById(id: number): Promise<Area | null> {
    const result = await this.client.query(
      "SELECT id, nombre, descripcion, activo FROM areas WHERE id = $1",
      [id],
    );
    return result.rows[0] ?? null;
  }

  async create(input: AreaCreateInput): Promise<Area> {
    const result = await this.client.query(
      "INSERT INTO areas (nombre, descripcion, activo) VALUES ($1, $2, TRUE) RETURNING id, nombre, descripcion, activo",
      [input.nombre.trim(), (input.descripcion || "").trim()],
    );
    return result.rows[0];
  }

  async update(input: AreaUpdateInput): Promise<Area | null> {
    const result = await this.client.query(
      "UPDATE areas SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), activo = COALESCE($3, activo) WHERE id = $4 RETURNING id, nombre, descripcion, activo",
      [input.nombre?.trim(), input.descripcion?.trim(), input.activo, input.id],
    );
    return result.rows[0] ?? null;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.client.query("UPDATE areas SET activo = FALSE WHERE id = $1", [id]);
    return (result.rowCount || 0) > 0;
  }

  async existsByName(nombre: string, excludeId?: number): Promise<boolean> {
    if (excludeId) {
      const result = await this.client.query(
        "SELECT id FROM areas WHERE LOWER(nombre) = LOWER($1) AND id != $2 LIMIT 1",
        [nombre.trim(), excludeId],
      );
      return result.rows.length > 0;
    }

    const result = await this.client.query(
      "SELECT id FROM areas WHERE LOWER(nombre) = LOWER($1) LIMIT 1",
      [nombre.trim()],
    );
    return result.rows.length > 0;
  }

  async countUsersByArea(id: number): Promise<number> {
    const result = await this.client.query(
      "SELECT COUNT(*) as total FROM usuarios WHERE area_id = $1",
      [id],
    );
    return Number(result.rows[0]?.total || 0);
  }
}
