import { Client } from "pg";
import { ListaPedidoRepository } from "../../../../domain/repositories/listaPedidos/ListaPedidoRepository";
import { ListaPedido, ListaPedidoCreateInput, ListaPedidoUpdateInput, TipoPedido } from "../../../../domain/entities/listaPedidos/ListaPedido";

export class PgListaPedidoRepository implements ListaPedidoRepository {
  constructor(private readonly client: Client) {}

  async findAll(tipo?: TipoPedido): Promise<ListaPedido[]> {
    const query = `
      SELECT lp.*, 
             COALESCE(eoo.titulo, eod.titulo, lp.fase, '') AS fase
      FROM lista_pedidos lp
      LEFT JOIN orden_trabajo ot ON ot.id = lp.orden_trabajo_id
      LEFT JOIN estado_orden_offset eoo ON eoo.id = ot.estado_orden_offset_id
      LEFT JOIN estado_orden_digital eod ON eod.id = ot.estado_orden_digital_id
      ${tipo ? 'WHERE lp.tipo = $1' : ''}
      ORDER BY lp.created_at DESC, lp.id DESC
    `;
    const params = tipo ? [tipo] : [];
    const r = await this.client.query(query, params);
    return r.rows;
  }

  async findById(id: number): Promise<ListaPedido | null> {
    const r = await this.client.query(
      `SELECT lp.*, 
              COALESCE(eoo.titulo, eod.titulo, lp.fase, '') AS fase
       FROM lista_pedidos lp
       LEFT JOIN orden_trabajo ot ON ot.id = lp.orden_trabajo_id
       LEFT JOIN estado_orden_offset eoo ON eoo.id = ot.estado_orden_offset_id
       LEFT JOIN estado_orden_digital eod ON eod.id = ot.estado_orden_digital_id
       WHERE lp.id = $1`,
      [id]
    );
    return r.rows[0] ?? null;
  }

  async create(input: ListaPedidoCreateInput): Promise<ListaPedido> {
    const r = await this.client.query(
      `INSERT INTO lista_pedidos (
         tipo, fecha_ingreso_pedido, fecha_aprobacion, fecha_entrega, responsable_nombre, cliente, cliente_id,
         descripcion_producto, cantidad, no_oc, no_op, estado, fase,
         no_factura, observaciones, created_by, updated_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        input.tipo,
        input.fecha_ingreso_pedido, input.fecha_aprobacion ?? null, input.fecha_entrega,
        input.responsable_nombre,
        input.cliente,
        input.cliente_id ?? null,
        input.descripcion_producto, input.cantidad,
        input.no_oc, input.no_op, input.estado, input.fase,
        input.no_factura, input.observaciones,
        input.created_by ?? null, input.updated_by ?? null,
      ]
    );
    return r.rows[0];
  }

  async update(input: ListaPedidoUpdateInput): Promise<ListaPedido | null> {
    const r = await this.client.query(
      `UPDATE lista_pedidos
       SET tipo=$1, fecha_ingreso_pedido=$2, fecha_aprobacion=$3, fecha_entrega=$4,
           responsable_nombre=$5, cliente=$6, cliente_id=$7, descripcion_producto=$8, cantidad=$9,
           no_oc=$10, no_op=$11, estado=$12, fase=$13, no_factura=$14,
           observaciones=$15, updated_by=$16
       WHERE id=$17
       RETURNING *`,
      [
        input.tipo,
        input.fecha_ingreso_pedido, input.fecha_aprobacion ?? null, input.fecha_entrega,
        input.responsable_nombre,
        input.cliente,
        input.cliente_id ?? null,
        input.descripcion_producto, input.cantidad,
        input.no_oc, input.no_op, input.estado, input.fase,
        input.no_factura, input.observaciones,
        input.updated_by ?? null, input.id,
      ]
    );
    return r.rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const r = await this.client.query(
      "DELETE FROM lista_pedidos WHERE id=$1 RETURNING id",
      [id]
    );
    return (r.rowCount ?? 0) > 0;
  }
}
