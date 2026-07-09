import { Client } from "pg";
import {
  ChangeEstadoCotizacionResult,
  CotizacionCommandRepository,
  CreateCotizacionInput,
  DeleteCotizacionResult,
  UpdateCotizacionInput,
  UpdateCotizacionResult,
} from "../../domain/repositories/CotizacionCommandRepository";

export class PgCotizacionCommandRepository implements CotizacionCommandRepository {
  constructor(private readonly client: Client) {}

  async createCotizacion(input: CreateCotizacionInput): Promise<any> {
    const estado = "pendiente";

    const insertQuery = `
      INSERT INTO cotizaciones (
        cliente_id,
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        estado,
        ruc_id,
        usuario_id,
        tiempo_entrega,
        forma_pago,
        validez_proforma,
        observaciones,
        contacto,
        celuar,
        nombre_ejecutivo,
        created_by,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      RETURNING *
    `;

    const result = await this.client.query(insertQuery, [
      input.cliente_id,
      input.fecha,
      input.subtotal,
      input.iva,
      input.descuento,
      input.total,
      estado,
      input.ruc_id,
      input.userId,
      input.tiempo_entrega,
      input.forma_pago,
      input.validez_proforma,
      input.observaciones,
      input.contacto || null,
      input.celuar || null,
      input.nombre_ejecutivo || input.userNombre || null,
      input.userId,
    ]);

    const cotizacion = result.rows[0];
    const cotizacionId = cotizacion.id;
    const codigoCotizacion = String(cotizacionId).padStart(9, "0");

    await this.client.query("UPDATE cotizaciones SET codigo_cotizacion = $1 WHERE id = $2", [
      codigoCotizacion,
      cotizacionId,
    ]);

    return {
      ...cotizacion,
      codigo_cotizacion: codigoCotizacion,
    };
  }

  async updateCotizacion(input: UpdateCotizacionInput): Promise<UpdateCotizacionResult> {
    const estadoActualResult = await this.client.query("SELECT estado FROM cotizaciones WHERE id = $1", [input.id]);

    if (estadoActualResult.rows.length === 0) {
      return { type: "not_found" };
    }

    const estadoActual = estadoActualResult.rows[0].estado;
    if (estadoActual === "aprobada" || estadoActual === "rechazada") {
      return { type: "blocked" };
    }

    const query = `
      UPDATE cotizaciones
      SET fecha = $1,
          subtotal = $2,
          iva = $3,
          descuento = $4,
          total = $5,
          ruc_id = $6,
          cliente_id = $7,
          tiempo_entrega = $8,
          forma_pago = $9,
          validez_proforma = $10,
          observaciones = $11,
          contacto = $12,
          celuar = $13,
          nombre_ejecutivo = $14,
          updated_by = $15,
          updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `;

    const result = await this.client.query(query, [
      input.fecha,
      input.subtotal,
      input.iva,
      input.descuento,
      input.total,
      input.ruc_id,
      input.cliente_id,
      input.tiempo_entrega,
      input.forma_pago,
      input.validez_proforma,
      input.observaciones,
      input.contacto || null,
      input.celuar || null,
      input.nombre_ejecutivo || null,
      input.updatedBy,
      input.id,
    ]);

    if (result.rows.length === 0) {
      return { type: "not_found" };
    }

    return { type: "updated", cotizacion: result.rows[0] };
  }

  async deleteCotizacion(id: number): Promise<DeleteCotizacionResult> {
    const checkQuery = "SELECT id, estado FROM cotizaciones WHERE id = $1";
    const checkResult = await this.client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return { type: "not_found" };
    }

    const estadoActual = checkResult.rows[0].estado;
    if (estadoActual === "aprobada" || estadoActual === "rechazada") {
      return { type: "blocked" };
    }

    await this.client.query("DELETE FROM detalle_cotizacion WHERE cotizacion_id = $1", [id]);
    const deleteResult = await this.client.query("DELETE FROM cotizaciones WHERE id = $1", [id]);

    if (deleteResult.rowCount === 0) {
      return { type: "not_found" };
    }

    return { type: "deleted" };
  }

  async approveCotizacion(id: number, observacion: string | null): Promise<ChangeEstadoCotizacionResult> {
    const result = await this.client.query(
      `UPDATE cotizaciones
       SET estado = 'aprobada',
           motivo_rechazo = NULL,
           observacion_aprobacion = $2
       WHERE id = $1
       RETURNING *`,
      [id, observacion],
    );

    if (result.rows.length === 0) {
      return { type: "not_found" };
    }

    return { type: "updated", cotizacion: result.rows[0] };
  }

  async rejectCotizacion(id: number, motivo: string): Promise<ChangeEstadoCotizacionResult> {
    const result = await this.client.query(
      `UPDATE cotizaciones
       SET estado = 'rechazada',
           motivo_rechazo = $2,
           observacion_aprobacion = NULL
       WHERE id = $1
       RETURNING *`,
      [id, motivo],
    );

    if (result.rows.length === 0) {
      return { type: "not_found" };
    }

    return { type: "updated", cotizacion: result.rows[0] };
  }
}
