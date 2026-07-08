import { Client } from "pg";
import { UsuarioRepository } from "../../../../domain/repositories/usuarios/UsuarioRepository";
import { UsuarioResumen, UsuarioVendedor } from "../../../../domain/entities/usuarios/Usuario";
import {
  CreateUsuarioRepositoryInput,
  FirmaUsuario,
  UpdateUsuarioRepositoryInput,
  UsuarioCreado,
} from "../../../../domain/repositories/usuarios/UsuarioRepository";
import { getCrudModuleIds } from "../../../../config/permissionCatalog";

export class PgUsuarioRepository implements UsuarioRepository {
  constructor(private readonly client: Client) {}

  async createUser(input: CreateUsuarioRepositoryInput): Promise<UsuarioCreado> {
    const primaryAreaId = input.area_ids[0];

    try {
      await this.client.query("BEGIN");

      const rolResult = await this.client.query(
        "SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND activo = true",
        [input.rol],
      );
      const rolId = rolResult.rows.length > 0 ? rolResult.rows[0].id : null;

      const insertResult = await this.client.query(
        "INSERT INTO usuarios (email, nombre_usuario, password_hash, nombre, apellido, rol, rol_id, area_id, email_personal, email_config, celular) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, email, nombre_usuario, nombre, apellido, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular",
        [
          input.email,
          input.nombre_usuario,
          input.password_hash,
          input.nombre,
          input.apellido,
          input.rol,
          rolId,
          primaryAreaId,
          input.email_personal,
          input.email_config,
          input.celular,
        ],
      );

      const newUserId = insertResult.rows[0].id;
      const modulos = getCrudModuleIds();

      for (const modulo of modulos) {
        await this.client.query(
          "INSERT INTO usuarios_permisos (usuario_id, modulo, puede_crear, puede_leer, puede_editar, puede_eliminar) VALUES ($1, $2, false, false, false, false) ON CONFLICT (usuario_id, modulo) DO NOTHING",
          [newUserId, modulo],
        );
      }

      await this.syncUserAreas(newUserId, input.area_ids);

      await this.client.query("COMMIT");
      return insertResult.rows[0];
    } catch (error) {
      try {
        await this.client.query("ROLLBACK");
      } catch (_) {
        // Ignore rollback error and throw original failure.
      }
      throw error;
    }
  }

  async findAll(): Promise<UsuarioResumen[]> {
    const result = await this.client.query(`
      SELECT
        u.id,
        u.email,
        u.nombre_usuario,
        u.nombre,
        u.apellido,
        u.rol,
        u.area_id,
        u.activo,
        u.fecha_creacion,
        u.firma_html,
        u.firma_activa,
        u.email_personal,
        u.email_config,
        u.celular,
        COALESCE(
          ARRAY_REMOVE(
            ARRAY_AGG(DISTINCT ua.area_id) FILTER (WHERE ua.area_id IS NOT NULL),
            NULL
          ),
          ARRAY[]::INTEGER[]
        ) AS area_ids
      FROM usuarios u
      LEFT JOIN usuarios_areas ua ON ua.usuario_id = u.id
      GROUP BY
        u.id,
        u.email,
        u.nombre_usuario,
        u.nombre,
        u.apellido,
        u.rol,
        u.area_id,
        u.activo,
        u.fecha_creacion,
        u.firma_html,
        u.firma_activa,
        u.email_personal,
        u.email_config,
        u.celular
      ORDER BY u.id ASC
    `);

    return result.rows;
  }

  async findVendedores(): Promise<UsuarioVendedor[]> {
    const result = await this.client.query(
      "SELECT id, nombre, apellido, email, celular FROM usuarios WHERE LOWER(rol) = LOWER($1) AND activo = true ORDER BY nombre, apellido",
      ["vendedor"],
    );

    return result.rows;
  }

  async updateUser(input: UpdateUsuarioRepositoryInput): Promise<UsuarioCreado | null> {
    const primaryAreaId = input.area_ids[0];

    try {
      await this.client.query("BEGIN");

      const rolResult = await this.client.query(
        "SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND activo = true",
        [input.rol],
      );
      const rolId = rolResult.rows.length > 0 ? rolResult.rows[0].id : null;

      let query = "UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, apellido = $4, rol = $5, rol_id = $6, area_id = $7, activo = $8, email_personal = $9, email_config = $10, celular = $11";
      let params: any[] = [
        input.email,
        input.nombre_usuario,
        input.nombre,
        input.apellido,
        input.rol,
        rolId,
        primaryAreaId,
        input.activo,
        input.email_personal,
        input.email_config,
        input.celular,
        input.id,
      ];

      if (input.password_hash) {
        query =
          "UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, apellido = $4, rol = $5, rol_id = $6, area_id = $7, activo = $8, email_personal = $9, email_config = $10, celular = $11, password_hash = $12 WHERE id = $13 RETURNING id, email, nombre_usuario, nombre, apellido, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular";
        params = [
          input.email,
          input.nombre_usuario,
          input.nombre,
          input.apellido,
          input.rol,
          rolId,
          primaryAreaId,
          input.activo,
          input.email_personal,
          input.email_config,
          input.celular,
          input.password_hash,
          input.id,
        ];
      } else {
        query +=
          " WHERE id = $12 RETURNING id, email, nombre_usuario, nombre, apellido, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular";
      }

      const result = await this.client.query(query, params);
      if (result.rows.length === 0) {
        await this.client.query("ROLLBACK");
        return null;
      }

      await this.syncUserAreas(input.id, input.area_ids);
      await this.client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      try {
        await this.client.query("ROLLBACK");
      } catch (_) {
        // Ignore rollback error and throw original failure.
      }
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.client.query("DELETE FROM usuarios WHERE id = $1", [id]);
    return (result.rowCount || 0) > 0;
  }

  async updateFirma(
    id: number,
    firma: { firma_html: string | null; firma_activa: boolean },
  ): Promise<FirmaUsuario | null> {
    const result = await this.client.query(
      "UPDATE usuarios SET firma_html = $1, firma_activa = $2 WHERE id = $3 RETURNING id, nombre, firma_html, firma_activa",
      [firma.firma_html, firma.firma_activa, id],
    );

    return result.rows[0] ?? null;
  }

  async findFirmaById(id: number): Promise<FirmaUsuario | null> {
    const result = await this.client.query(
      "SELECT id, nombre, firma_html, firma_activa FROM usuarios WHERE id = $1",
      [id],
    );

    return result.rows[0] ?? null;
  }

  private async syncUserAreas(usuarioId: number, areaIds: number[]) {
    await this.client.query("DELETE FROM usuarios_areas WHERE usuario_id = $1", [usuarioId]);

    for (let index = 0; index < areaIds.length; index += 1) {
      const areaId = areaIds[index];
      await this.client.query(
        `INSERT INTO usuarios_areas (usuario_id, area_id, es_principal, updated_at)
         VALUES ($1, $2, $3, NOW())`,
        [usuarioId, areaId, index === 0],
      );
    }

    await this.client.query("UPDATE usuarios SET area_id = $1 WHERE id = $2", [areaIds[0], usuarioId]);
  }
}
