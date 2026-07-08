import { Pedido } from "../../../../domain/entities/pedidos/Pedido";

export const mapPedidoRowToEntity = (row: Record<string, unknown>): Pedido => ({
  id: Number(row.id),
  fecha_ingreso_pedido: String(row.fecha_ingreso_pedido ?? ""),
  fecha_entrega: row.fecha_entrega ? String(row.fecha_entrega) : null,
  responsable_nombre: String(row.responsable_nombre ?? ""),
  cliente: String(row.cliente ?? ""),
  descripcion_producto: String(row.descripcion_producto ?? ""),
  cantidad: row.cantidad === null || row.cantidad === undefined ? null : Number(row.cantidad),
  no_oc: row.no_oc ? String(row.no_oc) : null,
  no_op: row.no_op ? String(row.no_op) : null,
  estado: row.estado ? String(row.estado) : null,
  fase: row.fase ? String(row.fase) : null,
  no_factura: row.no_factura ? String(row.no_factura) : null,
  observaciones: row.observaciones ? String(row.observaciones) : null,
});
