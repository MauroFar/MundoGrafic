import { Client } from "pg";
import { ListaPedidoRepository } from "../../../../domain/repositories/listaPedidos/ListaPedidoRepository";
import { ListaPedido, ListaPedidoCreateInput, ListaPedidoUpdateInput, TipoPedido } from "../../../../domain/entities/listaPedidos/ListaPedido";

export class PgListaPedidoRepository implements ListaPedidoRepository {
  constructor(private readonly client: Client) {}

  async findAll(tipo?: TipoPedido): Promise<ListaPedido[]> {
    if (tipo) {
      const r = await this.client.query(
        "SELECT * FROM lista_pedidos WHERE tipo = $1 ORDER BY created_at DESC, id DESC",
        [tipo]
      );
      return r.rows;
    }
    const r = await this.client.query(
      "SELECT * FROM lista_pedidos ORDER BY created_at DESC, id DESC"
    );
    return r.rows;
  }

  async findById(id: number): Promise<ListaPedido | null> {
    const r = await this.client.query(
      "SELECT * FROM lista_pedidos WHERE id = $1",
      [id]
    );
    return r.rows[0] ?? null;
  }

  async create(input: ListaPedidoCreateInput): Promise<ListaPedido> {
    const r = await this.client.query(
      `INSERT INTO lista_pedidos (
         tipo, fecha_ingreso_pedido, fecha_entrega, responsable_nombre, cliente,
         descripcion_producto, cantidad, no_oc, no_op, estado, fase,
         no_factura, observaciones, created_by, updated_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        input.tipo,
        input.fecha_ingreso_pedido, input.fecha_entrega, input.responsable_nombre,
        input.cliente, input.descripcion_producto, input.cantidad,
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
       SET tipo=$1, fecha_ingreso_pedido=$2, fecha_entrega=$3, responsable_nombre=$4,
           cliente=$5, descripcion_producto=$6, cantidad=$7, no_oc=$8, no_op=$9,
           estado=$10, fase=$11, no_factura=$12, observaciones=$13, updated_by=$14
       WHERE id=$15
       RETURNING *`,
      [
        input.tipo,
        input.fecha_ingreso_pedido, input.fecha_entrega, input.responsable_nombre,
        input.cliente, input.descripcion_producto, input.cantidad,
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
