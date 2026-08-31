import {
  ClienteBuscarItem,
  ClienteCreateInput,
  ClienteListado,
  ClienteUpdateInput,
} from "../../../../domain/entities/clientes/Cliente";
import { ClienteRepository } from "../../../../domain/repositories/clientes/ClienteRepository";
import { Client } from "pg";
import { AppError } from "../../../../shared/errors/AppError";

const CLIENTES_BASE_SELECT = `
  SELECT
    c.id,
    c.codigo_cliente,
    c.nombre_cliente as nombre,
    COALESCE(c.empresa_cliente, c.nombre_cliente) as empresa,
    c.email_cliente as email,
    c.telefono_cliente as telefono,
    c.direccion_cliente as direccion,
    c.ruc_cedula_cliente as ruc_cedula,
    c.estado_cliente as estado,
    c.notas_cliente as notas,
    c.fecha_registro,
    c.created_at,
    c.created_by,
    c.updated_by,
    c.updated_at,
    u1.nombre as created_by_nombre,
    u2.nombre as updated_by_nombre
  FROM clientes c
  LEFT JOIN usuarios u1 ON c.created_by = u1.id
  LEFT JOIN usuarios u2 ON c.updated_by = u2.id
`;

export class PgClienteRepository implements ClienteRepository {
  constructor(private readonly client: Client) {}

  async findAll(): Promise<ClienteListado[]> {
    const result = await this.client.query(`${CLIENTES_BASE_SELECT} ORDER BY c.id ASC`);
    return result.rows.map((cliente: any) => this.formatCliente(cliente));
  }

  async search(query: string): Promise<ClienteBuscarItem[]> {
    const result = await this.client.query(
      `
      SELECT id, nombre_cliente, empresa_cliente, email_cliente
      FROM clientes
      WHERE nombre_cliente ILIKE $1 OR email_cliente ILIKE $1 OR empresa_cliente ILIKE $1
      ORDER BY empresa_cliente ASC, nombre_cliente ASC
      LIMIT 10
      `,
      [`%${query}%`],
    );

    return result.rows;
  }

  async findById(id: number): Promise<ClienteListado | null> {
    const result = await this.client.query(`${CLIENTES_BASE_SELECT} WHERE c.id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return this.formatCliente(result.rows[0]);
  }

  async create(input: ClienteCreateInput): Promise<{ id: number; codigo_cliente: string; nombre_cliente: string; email_cliente: string | null }> {
    const email = this.normalizeOptionalString(input.email);
    const ruc_cedula = this.normalizeOptionalString(input.ruc_cedula);

    if (email) {
      const duplicateByEmail = await this.client.query(
        "SELECT id FROM clientes WHERE lower(NULLIF(trim(email_cliente), '')) = lower($1) LIMIT 1",
        [email],
      );
      if (duplicateByEmail.rows.length > 0) {
        throw new AppError("Ya existe un cliente con ese email", 409);
      }
    }

    if (ruc_cedula && ruc_cedula.toUpperCase() !== "N/A") {
      const duplicateByRuc = await this.client.query(
        "SELECT id FROM clientes WHERE lower(NULLIF(trim(ruc_cedula_cliente), '')) = lower($1) LIMIT 1",
        [ruc_cedula],
      );
      if (duplicateByRuc.rows.length > 0) {
        throw new AppError("Ya existe un cliente con ese RUC/Cédula", 409);
      }
    }

    const insertResult = await this.client.query(
      `
      INSERT INTO clientes (
        nombre_cliente,
        empresa_cliente,
        direccion_cliente,
        telefono_cliente,
        email_cliente,
        ruc_cedula_cliente,
        estado_cliente,
        notas_cliente,
        fecha_registro,
        created_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)
      RETURNING id
      `,
      [
        input.nombre,
        this.normalizeOptionalString(input.empresa),
        this.normalizeOptionalString(input.direccion),
        this.normalizeOptionalString(input.telefono),
        email,
        ruc_cedula,
        input.estado || "activo",
        this.normalizeOptionalString(input.notas),
        input.userId || null,
      ],
    );

    const clienteId = insertResult.rows[0].id;
    const codigoCliente = `CL${String(clienteId).padStart(5, "0")}`;

    await this.client.query("UPDATE clientes SET codigo_cliente = $1 WHERE id = $2", [codigoCliente, clienteId]);

    return {
      id: clienteId,
      codigo_cliente: codigoCliente,
      nombre_cliente: input.nombre,
      email_cliente: email,
    };
  }

  async update(input: ClienteUpdateInput): Promise<{ id: number; nombre_cliente: string; email_cliente: string | null } | null> {
    const email = this.normalizeOptionalString(input.email);
    const ruc_cedula = this.normalizeOptionalString(input.ruc_cedula);

    try {
      if (email || (ruc_cedula && ruc_cedula.toUpperCase() !== "N/A")) {
        const normalizedEmail = email ? email.toLowerCase() : null;
        const normalizedRuc = ruc_cedula && ruc_cedula.toUpperCase() !== "N/A" ? ruc_cedula.toLowerCase() : null;

        const checkResult = await this.client.query(
          `
          SELECT id FROM clientes
          WHERE (
            (lower(NULLIF(trim(email_cliente), '')) = lower($1) AND $1 IS NOT NULL)
            OR
            (lower(NULLIF(trim(ruc_cedula_cliente), '')) = lower($2) AND $2 IS NOT NULL)
          ) AND id != $3
          `,
          [normalizedEmail, normalizedRuc, input.id],
        );

        if (checkResult.rows.length > 0) {
          throw new AppError("Ya existe otro cliente con ese email o RUC/Cédula", 409);
        }
      }

      const result = await this.client.query(
        `
        UPDATE clientes
        SET
          nombre_cliente = $1,
          empresa_cliente = $2,
          direccion_cliente = $3,
          telefono_cliente = $4,
          email_cliente = $5,
          ruc_cedula_cliente = $6,
          estado_cliente = $7,
          notas_cliente = $8,
          updated_by = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING id, nombre_cliente, email_cliente
        `,
        [
          input.nombre,
          this.normalizeOptionalString(input.empresa),
          this.normalizeOptionalString(input.direccion),
          this.normalizeOptionalString(input.telefono),
          email,
          ruc_cedula,
          input.estado || "activo",
          this.normalizeOptionalString(input.notas),
          input.userId || null,
          input.id,
        ],
      );

      return result.rows[0] ?? null;
    } catch (error) {
      console.error("❌ Error en PgClienteRepository.update:", error);
      throw error;
    }
  }

  private normalizeOptionalString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized === "" ? null : normalized;
  }

  async hasRelatedDocuments(id: number): Promise<boolean> {
    const tableCheck = await this.client.query(
      `
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'cotizaciones'
        ) AS cotizaciones_table_exists,
        EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'ordenes_trabajo'
        ) AS ordenes_table_exists
      `,
    );

    const cotizacionesTableExists = Boolean(tableCheck.rows[0]?.cotizaciones_table_exists);
    const ordenesTableExists = Boolean(tableCheck.rows[0]?.ordenes_table_exists);

    if (!cotizacionesTableExists && !ordenesTableExists) {
      return false;
    }

    let cotizaciones = 0;
    let ordenes = 0;

    if (cotizacionesTableExists) {
      const cotizacionesResult = await this.client.query(
        `SELECT COUNT(*)::int AS count FROM cotizaciones WHERE cliente_id = $1`,
        [id],
      );
      cotizaciones = Number(cotizacionesResult.rows[0]?.count || 0);
    }

    if (ordenesTableExists) {
      const ordenesResult = await this.client.query(
        `SELECT COUNT(*)::int AS count FROM ordenes_trabajo WHERE cliente_id = $1`,
        [id],
      );
      ordenes = Number(ordenesResult.rows[0]?.count || 0);
    }

    return cotizaciones > 0 || ordenes > 0;
  }

  async delete(id: number): Promise<{ id: number; nombre_cliente: string } | null> {
    const result = await this.client.query(
      `
      DELETE FROM clientes
      WHERE id = $1
      RETURNING id, nombre_cliente
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  private formatCliente(cliente: any): ClienteListado {
    return {
      id: cliente.id,
      codigo: cliente.codigo_cliente,
      nombre: cliente.nombre,
      empresa: cliente.empresa,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      ruc_cedula: cliente.ruc_cedula || "N/A",
      estado: cliente.estado || "activo",
      notas: cliente.notas || "",
      fechaRegistro: cliente.fecha_registro || cliente.created_at,
      createdBy: cliente.created_by_nombre || "Sistema",
      createdAt: cliente.created_at || cliente.fecha_registro,
      updatedBy: cliente.updated_by_nombre || null,
      updatedAt: cliente.updated_at || null,
    };
  }
}
