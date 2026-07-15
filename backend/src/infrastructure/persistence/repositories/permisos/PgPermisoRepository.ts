import { Client } from "pg";
import { PermisoRepository } from "../../../../domain/repositories/permisos/PermisoRepository";
import { Permiso, PermisoUpsertInput } from "../../../../domain/entities/permisos/Permiso";

export class PgPermisoRepository implements PermisoRepository {
  constructor(private readonly client: Client) {}

  async findByUsuario(usuarioId: number): Promise<Permiso[]> {
    const r = await this.client.query(
      "SELECT * FROM usuarios_permisos WHERE usuario_id = $1 ORDER BY modulo",
      [usuarioId]
    );
    return r.rows;
  }

  async findModulosDisponibles(userId: number): Promise<string[]> {
    const r = await this.client.query(
      "SELECT modulo FROM usuarios_permisos WHERE usuario_id = $1 AND puede_leer = true",
      [userId]
    );
    return r.rows.map((row: any) => row.modulo);
  }

  async isAdmin(userId: number): Promise<boolean> {
    const r = await this.client.query(
      `SELECT u.rol, r.es_sistema
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1 AND u.activo = true`,
      [userId]
    );
    if (!r.rows.length) return false;
    return r.rows[0].rol === "admin" || r.rows[0].es_sistema === true;
  }

  async tienePermiso(userId: number, modulo: string, accion: string): Promise<boolean> {
    // Construimos la columna dinámicamente — solo aceptamos valores del catálogo
    const accionesValidas = ["crear", "leer", "editar", "eliminar"];
    if (!accionesValidas.includes(accion)) return false;

    const col = `puede_${accion}`;
    const r = await this.client.query(
      `SELECT ${col} AS tiene_permiso FROM usuarios_permisos WHERE usuario_id = $1 AND modulo = $2`,
      [userId, modulo]
    );
    return r.rows[0]?.tiene_permiso ?? false;
  }

  async replaceAll(usuarioId: number, permisos: PermisoUpsertInput[]): Promise<void> {
    await this.client.query("BEGIN");
    try {
      await this.client.query(
        "DELETE FROM usuarios_permisos WHERE usuario_id = $1",
        [usuarioId]
      );
      for (const p of permisos) {
        await this.client.query(
          `INSERT INTO usuarios_permisos
             (usuario_id, modulo, puede_crear, puede_leer, puede_editar, puede_eliminar, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [usuarioId, p.modulo, p.puede_crear, p.puede_leer, p.puede_editar, p.puede_eliminar]
        );
      }
      await this.client.query("COMMIT");
    } catch (err) {
      await this.client.query("ROLLBACK");
      throw err;
    }
  }
}
