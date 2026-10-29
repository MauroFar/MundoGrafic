import { Client } from "pg";

export type MaterialDigital = {
  id: number;
  nombre: string;
  unidad: string;
  costo_unitario: number;
  estado: string;
  usuario_creacion_id?: number | null;
  usuario_modificacion_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type ProcesoDigital = {
  id: number;
  nombre: string;
  tipo_cobro: string;
  precio: number;
  estado: string;
  usuario_creacion_id?: number | null;
  usuario_modificacion_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type CostoOperativoDigital = {
  id: number;
  concepto: string;
  costo_fijo: number;
  estado: string;
  usuario_creacion_id?: number | null;
  usuario_modificacion_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type MargenComercial = {
  id: number;
  configuracion_comercial_id: number;
  nombre: string;
  porcentaje: number;
  activo: boolean;
  orden: number;
  usuario_modificacion_id?: number | null;
  updated_at?: string;
};

export type PlazoComercial = {
  id: number;
  configuracion_comercial_id: number;
  nombre: string;
  dias: number;
  recargo_porcentaje: number;
  activo: boolean;
  orden: number;
  usuario_modificacion_id?: number | null;
  updated_at?: string;
};

export type ConfiguracionComercial = {
  id: number;
  nombre: string;
  activo: boolean;
  usuario_modificacion_id?: number | null;
  updated_at?: string;
};

export class PgDigitalCostosRepository {
  constructor(private readonly client: Client) {}

  private async logAudit(
    tabla: string,
    registroId: number,
    accion: "crear" | "editar" | "eliminar",
    usuarioId: number | null,
    datosAnteriores: Record<string, any> | null,
    datosNuevos: Record<string, any> | null,
  ) {
    await this.client.query(
      `INSERT INTO auditoria_parametros_digital (tabla, registro_id, accion, usuario_id, datos_anteriores, datos_nuevos)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tabla,
        registroId,
        accion,
        usuarioId,
        datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datosNuevos ? JSON.stringify(datosNuevos) : null,
      ],
    );
  }

  async listarMateriales(): Promise<MaterialDigital[]> {
    const result = await this.client.query(
      `SELECT * FROM materiales_digitales ORDER BY nombre ASC`,
    );
    return result.rows;
  }

  async crearMaterial(input: Partial<MaterialDigital>, usuarioId: number | null): Promise<MaterialDigital> {
    const { nombre, unidad, costo_unitario, estado } = input;
    const result = await this.client.query(
      `INSERT INTO materiales_digitales (nombre, unidad, costo_unitario, estado, usuario_creacion_id, usuario_modificacion_id)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING *`,
      [nombre, unidad || "Metro", costo_unitario, estado || "Activo", usuarioId],
    );

    const created = result.rows[0];
    await this.logAudit("materiales_digitales", created.id, "crear", usuarioId, null, created);

    return created;
  }

  async actualizarMaterial(id: number, input: Partial<MaterialDigital>, usuarioId: number | null): Promise<MaterialDigital | null> {
    const previous = await this.client.query(
      `SELECT * FROM materiales_digitales WHERE id = $1`,
      [id],
    );

    if (!previous.rows[0]) {
      return null;
    }

    const { nombre, unidad, costo_unitario, estado } = input;
    const result = await this.client.query(
      `UPDATE materiales_digitales
       SET nombre = COALESCE($1, nombre),
           unidad = COALESCE($2, unidad),
           costo_unitario = COALESCE($3, costo_unitario),
           estado = COALESCE($4, estado),
           usuario_modificacion_id = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nombre, unidad, costo_unitario, estado, usuarioId, id],
    );

    const updated = result.rows[0];
    await this.logAudit("materiales_digitales", id, "editar", usuarioId, previous.rows[0], updated);

    return updated;
  }

  async eliminarMaterial(id: number, usuarioId: number | null): Promise<boolean> {
    const previous = await this.client.query(
      `SELECT * FROM materiales_digitales WHERE id = $1`,
      [id],
    );

    if (!previous.rows[0]) {
      return false;
    }

    await this.client.query(`DELETE FROM materiales_digitales WHERE id = $1`, [id]);
    await this.logAudit("materiales_digitales", id, "eliminar", usuarioId, previous.rows[0], null);
    return true;
  }

  async listarProcesos(): Promise<ProcesoDigital[]> {
    const result = await this.client.query(
      `SELECT * FROM procesos_digitales ORDER BY nombre ASC`,
    );
    return result.rows;
  }

  async crearProceso(input: Partial<ProcesoDigital>, usuarioId: number | null): Promise<ProcesoDigital> {
    const { nombre, tipo_cobro, precio, estado } = input;
    const result = await this.client.query(
      `INSERT INTO procesos_digitales (nombre, tipo_cobro, precio, estado, usuario_creacion_id, usuario_modificacion_id)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING *`,
      [nombre, tipo_cobro || "metro", precio, estado || "Activo", usuarioId],
    );

    const created = result.rows[0];
    await this.logAudit("procesos_digitales", created.id, "crear", usuarioId, null, created);

    return created;
  }

  async actualizarProceso(id: number, input: Partial<ProcesoDigital>, usuarioId: number | null): Promise<ProcesoDigital | null> {
    const previous = await this.client.query(`SELECT * FROM procesos_digitales WHERE id = $1`, [id]);
    if (!previous.rows[0]) {
      return null;
    }

    const { nombre, tipo_cobro, precio, estado } = input;
    const result = await this.client.query(
      `UPDATE procesos_digitales
       SET nombre = COALESCE($1, nombre),
           tipo_cobro = COALESCE($2, tipo_cobro),
           precio = COALESCE($3, precio),
           estado = COALESCE($4, estado),
           usuario_modificacion_id = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nombre, tipo_cobro, precio, estado, usuarioId, id],
    );

    const updated = result.rows[0];
    await this.logAudit("procesos_digitales", id, "editar", usuarioId, previous.rows[0], updated);

    return updated;
  }

  async eliminarProceso(id: number, usuarioId: number | null): Promise<boolean> {
    const previous = await this.client.query(`SELECT * FROM procesos_digitales WHERE id = $1`, [id]);
    if (!previous.rows[0]) {
      return false;
    }

    await this.client.query(`DELETE FROM procesos_digitales WHERE id = $1`, [id]);
    await this.logAudit("procesos_digitales", id, "eliminar", usuarioId, previous.rows[0], null);
    return true;
  }

  async listarCostosOperativos(): Promise<CostoOperativoDigital[]> {
    const result = await this.client.query(
      `SELECT * FROM costos_operativos_digitales ORDER BY concepto ASC`,
    );
    return result.rows;
  }

  async crearCostoOperativo(input: Partial<CostoOperativoDigital>, usuarioId: number | null): Promise<CostoOperativoDigital> {
    const { concepto, costo_fijo, estado } = input;
    const result = await this.client.query(
      `INSERT INTO costos_operativos_digitales (concepto, costo_fijo, estado, usuario_creacion_id, usuario_modificacion_id)
       VALUES ($1, $2, $3, $4, $4)
       RETURNING *`,
      [concepto, costo_fijo, estado || "Activo", usuarioId],
    );

    const created = result.rows[0];
    await this.logAudit("costos_operativos_digitales", created.id, "crear", usuarioId, null, created);

    return created;
  }

  async actualizarCostoOperativo(id: number, input: Partial<CostoOperativoDigital>, usuarioId: number | null): Promise<CostoOperativoDigital | null> {
    const previous = await this.client.query(`SELECT * FROM costos_operativos_digitales WHERE id = $1`, [id]);
    if (!previous.rows[0]) {
      return null;
    }

    const { concepto, costo_fijo, estado } = input;
    const result = await this.client.query(
      `UPDATE costos_operativos_digitales
       SET concepto = COALESCE($1, concepto),
           costo_fijo = COALESCE($2, costo_fijo),
           estado = COALESCE($3, estado),
           usuario_modificacion_id = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [concepto, costo_fijo, estado, usuarioId, id],
    );

    const updated = result.rows[0];
    await this.logAudit("costos_operativos_digitales", id, "editar", usuarioId, previous.rows[0], updated);

    return updated;
  }

  async eliminarCostoOperativo(id: number, usuarioId: number | null): Promise<boolean> {
    const previous = await this.client.query(`SELECT * FROM costos_operativos_digitales WHERE id = $1`, [id]);
    if (!previous.rows[0]) {
      return false;
    }

    await this.client.query(`DELETE FROM costos_operativos_digitales WHERE id = $1`, [id]);
    await this.logAudit("costos_operativos_digitales", id, "eliminar", usuarioId, previous.rows[0], null);
    return true;
  }

  async obtenerConfiguracionComercial(): Promise<{
    configuracion: ConfiguracionComercial | null;
    margenes: MargenComercial[];
    plazos: PlazoComercial[];
  }> {
    const configuracionResult = await this.client.query(
      `SELECT * FROM configuracion_comercial ORDER BY id ASC LIMIT 1`,
    );

    const configuracion = configuracionResult.rows[0] || null;

    const margenes = configuracion
      ? await this.client.query(
          `SELECT * FROM configuracion_comercial_margenes WHERE configuracion_comercial_id = $1 ORDER BY orden ASC, nombre ASC`,
          [configuracion.id],
        )
      : { rows: [] };

    const plazos = configuracion
      ? await this.client.query(
          `SELECT * FROM configuracion_comercial_plazos WHERE configuracion_comercial_id = $1 ORDER BY orden ASC, dias ASC`,
          [configuracion.id],
        )
      : { rows: [] };

    return {
      configuracion,
      margenes: margenes.rows,
      plazos: plazos.rows,
    };
  }

  async crearConfiguracionComercial(usuarioId: number | null): Promise<ConfiguracionComercial> {
    const result = await this.client.query(
      `INSERT INTO configuracion_comercial (nombre, activo, usuario_modificacion_id)
       VALUES ('Configuración principal', true, $1)
       RETURNING *`,
      [usuarioId],
    );

    return result.rows[0];
  }

  async crearMargen(input: Partial<MargenComercial>, usuarioId: number | null): Promise<MargenComercial> {
    const { configuracion_comercial_id, nombre, porcentaje, activo, orden } = input;
    const result = await this.client.query(
      `INSERT INTO configuracion_comercial_margenes (configuracion_comercial_id, nombre, porcentaje, activo, orden, usuario_modificacion_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [configuracion_comercial_id, nombre, porcentaje, activo ?? true, orden ?? 1, usuarioId],
    );

    return result.rows[0];
  }

  async actualizarMargen(id: number, input: Partial<MargenComercial>, usuarioId: number | null): Promise<MargenComercial | null> {
    const previous = await this.client.query(`SELECT * FROM configuracion_comercial_margenes WHERE id = $1`, [id]);
    if (!previous.rows[0]) return null;

    const { nombre, porcentaje, activo, orden } = input;
    const result = await this.client.query(
      `UPDATE configuracion_comercial_margenes
       SET nombre = COALESCE($1, nombre),
           porcentaje = COALESCE($2, porcentaje),
           activo = COALESCE($3, activo),
           orden = COALESCE($4, orden),
           usuario_modificacion_id = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nombre, porcentaje, activo, orden, usuarioId, id],
    );

    return result.rows[0];
  }

  async eliminarMargen(id: number): Promise<boolean> {
    const result = await this.client.query(`DELETE FROM configuracion_comercial_margenes WHERE id = $1 RETURNING id`, [id]);
    return result.rowCount > 0;
  }

  async crearPlazo(input: Partial<PlazoComercial>, usuarioId: number | null): Promise<PlazoComercial> {
    const { configuracion_comercial_id, nombre, dias, recargo_porcentaje, activo, orden } = input;
    const result = await this.client.query(
      `INSERT INTO configuracion_comercial_plazos (configuracion_comercial_id, nombre, dias, recargo_porcentaje, activo, orden, usuario_modificacion_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [configuracion_comercial_id, nombre, dias, recargo_porcentaje ?? 0, activo ?? true, orden ?? 1, usuarioId],
    );

    return result.rows[0];
  }

  async actualizarPlazo(id: number, input: Partial<PlazoComercial>, usuarioId: number | null): Promise<PlazoComercial | null> {
    const previous = await this.client.query(`SELECT * FROM configuracion_comercial_plazos WHERE id = $1`, [id]);
    if (!previous.rows[0]) return null;

    const { nombre, dias, recargo_porcentaje, activo, orden } = input;
    const result = await this.client.query(
      `UPDATE configuracion_comercial_plazos
       SET nombre = COALESCE($1, nombre),
           dias = COALESCE($2, dias),
           recargo_porcentaje = COALESCE($3, recargo_porcentaje),
           activo = COALESCE($4, activo),
           orden = COALESCE($5, orden),
           usuario_modificacion_id = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [nombre, dias, recargo_porcentaje, activo, orden, usuarioId, id],
    );

    return result.rows[0];
  }

  async eliminarPlazo(id: number): Promise<boolean> {
    const result = await this.client.query(`DELETE FROM configuracion_comercial_plazos WHERE id = $1 RETURNING id`, [id]);
    return result.rowCount > 0;
  }
}
