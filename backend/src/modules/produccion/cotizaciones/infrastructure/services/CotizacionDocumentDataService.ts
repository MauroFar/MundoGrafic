import { Client } from "pg";

export class CotizacionDocumentDataService {
  constructor(private readonly client: Client) {}

  async getCotizacionDocumentData(id: number) {
    const cotizacionQuery = `
      SELECT
        c.id,
        c.codigo_cotizacion,
        c.fecha,
        c.subtotal,
        c.iva,
        c.descuento,
        c.total,
        c.usuario_id,
        cl.nombre_cliente,
        cl.empresa_cliente,
        COALESCE(c.nombre_ejecutivo, TRIM(CONCAT_WS(' ', u.nombre, u.apellido))) AS nombre_ejecutivo,
        r.ruc,
        r.descripcion AS ruc_descripcion,
        c.tiempo_entrega,
        c.forma_pago,
        c.validez_proforma,
        c.observaciones,
        c.contacto,
        c.celuar,
        c.mostrar_totales
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN rucs r ON c.ruc_id = r.id
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = $1
    `;

    const cotizacionResult = await this.client.query(cotizacionQuery, [id]);
    if (cotizacionResult.rows.length === 0) {
      return null;
    }

    const detallesQuery = `
      SELECT
        d.id,
        d.cantidad,
        d.detalle,
        d.valor_unitario,
        d.valor_total,
        d.usa_escalas,
        d.alineacion_imagenes,
        d.posicion_imagen,
        d.texto_negrita
      FROM detalle_cotizacion d
      WHERE d.cotizacion_id = $1
      ORDER BY d.id ASC
    `;

    const detallesResult = await this.client.query(detallesQuery, [id]);

    const detalles = await Promise.all(
      detallesResult.rows.map(async (detalle) => {
        const imagenesQuery = `
          SELECT imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion
          FROM detalle_cotizacion_imagenes
          WHERE detalle_cotizacion_id = $1
          ORDER BY orden ASC
        `;
        const escalasQuery = `
          SELECT id, detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden
          FROM detalle_cotizacion_escalas
          WHERE detalle_cotizacion_id = $1
          ORDER BY orden ASC, id ASC
        `;

        const [imagenesResult, escalasResult] = await Promise.all([
          this.client.query(imagenesQuery, [detalle.id]),
          this.client.query(escalasQuery, [detalle.id]),
        ]);

        return {
          ...detalle,
          imagenes: imagenesResult.rows,
          escalas: escalasResult.rows,
        };
      }),
    );

    return {
      cotizacion: cotizacionResult.rows[0],
      detalles,
    };
  }
}
