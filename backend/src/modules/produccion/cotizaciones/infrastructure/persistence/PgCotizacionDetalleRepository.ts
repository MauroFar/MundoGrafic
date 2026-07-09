import { Client } from "pg";
import {
  CotizacionDetalleRepository,
  CreateCotizacionDetalleInput,
  ReplaceCotizacionDetallesInput,
} from "../../domain/repositories/CotizacionDetalleRepository";

const parseCantidadEntera = (valor: any) => {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? Math.trunc(valor) : 0;
  }

  const texto = String(valor).trim();
  if (!texto) return 0;

  const soloDigitos = texto.replace(/\D/g, "");
  if (!soloDigitos) return 0;

  const parsed = Number.parseInt(soloDigitos, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizarDimensionImagen = (valor: any, fallback: number) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return fallback;

  const entero = Math.round(numero);
  return entero > 0 ? entero : fallback;
};

const normalizarDecimal = (valor: any) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
};

const normalizarEscalas = (escalas: any[] = []) => {
  if (!Array.isArray(escalas)) return [];

  return escalas
    .map((escala, index) => {
      const cantidad = parseCantidadEntera(escala?.cantidad);
      const valorUnitario = normalizarDecimal(escala?.valor_unitario);
      const valorTotal = normalizarDecimal(escala?.valor_total);

      return {
        cantidad,
        valor_unitario: valorUnitario,
        valor_total: valorTotal || Number((cantidad * valorUnitario).toFixed(2)),
        orden: Number.isFinite(Number(escala?.orden)) ? Number(escala.orden) : index,
      };
    })
    .filter((escala) => escala.cantidad > 0 || escala.valor_unitario > 0 || escala.valor_total > 0);
};

export class PgCotizacionDetalleRepository implements CotizacionDetalleRepository {
  constructor(private readonly client: Client) {}

  private async obtenerEscalasDetalle(detalleId: number) {
    const escalasQuery = `
      SELECT id, detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden
      FROM detalle_cotizacion_escalas
      WHERE detalle_cotizacion_id = $1
      ORDER BY orden ASC, id ASC
    `;

    const escalasResult = await this.client.query(escalasQuery, [detalleId]);
    return escalasResult.rows;
  }

  private async obtenerImagenesDetalle(detalleId: number) {
    const imagenesQuery = `
      SELECT id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion
      FROM detalle_cotizacion_imagenes
      WHERE detalle_cotizacion_id = $1
      ORDER BY orden ASC
    `;

    const imagenesResult = await this.client.query(imagenesQuery, [detalleId]);
    return imagenesResult.rows;
  }

  private async enriquecerDetalle(detalle: any) {
    const [imagenes, escalas] = await Promise.all([
      this.obtenerImagenesDetalle(detalle.id),
      this.obtenerEscalasDetalle(detalle.id),
    ]);

    return {
      ...detalle,
      imagenes,
      escalas,
    };
  }

  async getDetallesByCotizacionId(cotizacionId: number): Promise<any[]> {
    const query = `
      SELECT
        id,
        cotizacion_id,
        cantidad,
        detalle,
        valor_unitario,
        valor_total,
        usa_escalas,
        alineacion_imagenes,
        posicion_imagen,
        texto_negrita
      FROM detalle_cotizacion
      WHERE cotizacion_id = $1
      ORDER BY id ASC
    `;

    const result = await this.client.query(query, [cotizacionId]);
    return Promise.all(result.rows.map((row) => this.enriquecerDetalle(row)));
  }

  async createDetalle(input: CreateCotizacionDetalleInput): Promise<any> {
    const usaEscalas = Boolean(input.usa_escalas);
    const escalasNormalizadas = normalizarEscalas(input.escalas as any[]);
    const cantidadNormalizada = parseCantidadEntera(input.cantidad);

    if (!input.cotizacion_id || !input.detalle) {
      throw new Error("Faltan datos requeridos o son inválidos");
    }

    if (usaEscalas && escalasNormalizadas.length === 0) {
      throw new Error("Debe agregar al menos una escala válida");
    }

    if (
      !usaEscalas
      && (input.cantidad === undefined || input.valor_unitario === undefined || input.valor_total === undefined)
    ) {
      throw new Error("Faltan datos requeridos para un detalle sin escalas");
    }

    const query = `
      INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita
    `;

    const result = await this.client.query(query, [
      input.cotizacion_id,
      usaEscalas ? 0 : cantidadNormalizada,
      input.detalle,
      usaEscalas ? 0 : normalizarDecimal(input.valor_unitario),
      usaEscalas ? 0 : normalizarDecimal(input.valor_total),
      usaEscalas,
      input.alineacion_imagenes || "horizontal",
      input.posicion_imagen || "abajo",
      input.texto_negrita || false,
    ]);

    const detalleInsertado = result.rows[0];
    const detalleId = detalleInsertado.id;

    if (usaEscalas && escalasNormalizadas.length > 0) {
      const escalaQuery = `
        INSERT INTO detalle_cotizacion_escalas (detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden)
        VALUES ($1, $2, $3, $4, $5)
      `;

      for (const escala of escalasNormalizadas) {
        await this.client.query(escalaQuery, [
          detalleId,
          escala.cantidad,
          escala.valor_unitario,
          escala.valor_total,
          escala.orden,
        ]);
      }
    }

    if (input.imagenes && Array.isArray(input.imagenes) && input.imagenes.length > 0) {
      const imageQuery = `
        INSERT INTO detalle_cotizacion_imagenes (detalle_cotizacion_id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (let i = 0; i < input.imagenes.length; i += 1) {
        const img = input.imagenes[i];
        await this.client.query(imageQuery, [
          detalleId,
          img.imagen_ruta,
          i,
          normalizarDimensionImagen(img.imagen_width, 200),
          normalizarDimensionImagen(img.imagen_height, 150),
          Number.isFinite(Number(img.imagen_rotacion)) ? Number(img.imagen_rotacion) : 0,
        ]);
      }
    }

    return this.enriquecerDetalle(detalleInsertado);
  }

  async replaceDetalles(input: ReplaceCotizacionDetallesInput): Promise<any[]> {
    const { cotizacionId, detalles } = input;

    if (!Array.isArray(detalles)) {
      throw new Error("Se requiere un array de detalles válido");
    }

    await this.client.query("DELETE FROM detalle_cotizacion WHERE cotizacion_id = $1", [cotizacionId]);

    const resultadosDetalles: any[] = [];

    for (const detalle of detalles) {
      const descripcion = detalle?.detalle;
      const usaEscalas = Boolean(detalle?.usa_escalas);
      const escalasNormalizadas = normalizarEscalas(detalle?.escalas);
      const cantidadNormalizada = parseCantidadEntera(detalle?.cantidad);

      if (descripcion === undefined) {
        throw new Error("Falta la descripción del detalle");
      }

      if (usaEscalas && escalasNormalizadas.length === 0) {
        throw new Error("Cada detalle con escalas debe tener al menos una escala válida");
      }

      if (!usaEscalas && (detalle?.cantidad === undefined || detalle?.valor_unitario === undefined || detalle?.valor_total === undefined)) {
        throw new Error("Faltan campos requeridos en los detalles");
      }

      const insertQuery = `
        INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita
      `;

      const insertResult = await this.client.query(insertQuery, [
        cotizacionId,
        usaEscalas ? 0 : cantidadNormalizada,
        descripcion,
        usaEscalas ? 0 : normalizarDecimal(detalle?.valor_unitario),
        usaEscalas ? 0 : normalizarDecimal(detalle?.valor_total),
        usaEscalas,
        detalle?.alineacion_imagenes || "horizontal",
        detalle?.posicion_imagen || "abajo",
        detalle?.texto_negrita || false,
      ]);

      const detalleInsertado = insertResult.rows[0];
      const detalleId = detalleInsertado.id;

      if (usaEscalas && escalasNormalizadas.length > 0) {
        const escalaQuery = `
          INSERT INTO detalle_cotizacion_escalas (detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden)
          VALUES ($1, $2, $3, $4, $5)
        `;

        for (const escala of escalasNormalizadas) {
          await this.client.query(escalaQuery, [
            detalleId,
            escala.cantidad,
            escala.valor_unitario,
            escala.valor_total,
            escala.orden,
          ]);
        }
      }

      if (detalle?.imagenes && Array.isArray(detalle.imagenes) && detalle.imagenes.length > 0) {
        const imageQuery = `
          INSERT INTO detalle_cotizacion_imagenes (detalle_cotizacion_id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        for (let i = 0; i < detalle.imagenes.length; i += 1) {
          const img = detalle.imagenes[i];
          await this.client.query(imageQuery, [
            detalleId,
            img.imagen_ruta,
            i,
            normalizarDimensionImagen(img.imagen_width, 200),
            normalizarDimensionImagen(img.imagen_height, 150),
            Number.isFinite(Number(img.imagen_rotacion)) ? Number(img.imagen_rotacion) : 0,
          ]);
        }
      }

      resultadosDetalles.push(await this.enriquecerDetalle(detalleInsertado));
    }

    return resultadosDetalles;
  }
}
