import pool from "../../../../db/pool";
import { Pedido } from "../../../../domain/entities/pedidos/Pedido";
import { PedidoRepository } from "../../../../domain/repositories/pedidos/PedidoRepository";
import { mapPedidoRowToEntity } from "../../mappers/pedidos/PedidoDbMapper";

export class PgPedidoRepository implements PedidoRepository {
  async findAll(): Promise<Pedido[]> {
    const result = await pool.query("SELECT * FROM lista_pedidos ORDER BY id DESC");
    return result.rows.map((row) => mapPedidoRowToEntity(row));
  }

  async findById(id: number): Promise<Pedido | null> {
    const result = await pool.query("SELECT * FROM lista_pedidos WHERE id = $1 LIMIT 1", [id]);
    return result.rows[0] ? mapPedidoRowToEntity(result.rows[0]) : null;
  }

  async save(pedido: Omit<Pedido, "id">): Promise<Pedido> {
    const result = await pool.query(
      `INSERT INTO lista_pedidos (
        fecha_ingreso_pedido,
        fecha_entrega,
        responsable_nombre,
        cliente,
        descripcion_producto,
        cantidad,
        no_oc,
        no_op,
        estado,
        fase,
        no_factura,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        pedido.fecha_ingreso_pedido,
        pedido.fecha_entrega ?? null,
        pedido.responsable_nombre,
        pedido.cliente,
        pedido.descripcion_producto,
        pedido.cantidad ?? null,
        pedido.no_oc ?? null,
        pedido.no_op ?? null,
        pedido.estado ?? null,
        pedido.fase ?? null,
        pedido.no_factura ?? null,
        pedido.observaciones ?? null,
      ]
    );

    return mapPedidoRowToEntity(result.rows[0]);
  }

  async update(id: number, pedido: Partial<Omit<Pedido, "id">>): Promise<Pedido | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const nextPedido = { ...current, ...pedido };
    const result = await pool.query(
      `UPDATE lista_pedidos SET
        fecha_ingreso_pedido = $1,
        fecha_entrega = $2,
        responsable_nombre = $3,
        cliente = $4,
        descripcion_producto = $5,
        cantidad = $6,
        no_oc = $7,
        no_op = $8,
        estado = $9,
        fase = $10,
        no_factura = $11,
        observaciones = $12
      WHERE id = $13
      RETURNING *`,
      [
        nextPedido.fecha_ingreso_pedido,
        nextPedido.fecha_entrega ?? null,
        nextPedido.responsable_nombre,
        nextPedido.cliente,
        nextPedido.descripcion_producto,
        nextPedido.cantidad ?? null,
        nextPedido.no_oc ?? null,
        nextPedido.no_op ?? null,
        nextPedido.estado ?? null,
        nextPedido.fase ?? null,
        nextPedido.no_factura ?? null,
        nextPedido.observaciones ?? null,
        id,
      ]
    );

    return mapPedidoRowToEntity(result.rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM lista_pedidos WHERE id = $1", [id]);
    return result.rowCount > 0;
  }
}
