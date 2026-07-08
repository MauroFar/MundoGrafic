export interface Pedido {
  id: number;
  fecha_ingreso_pedido: string;
  fecha_entrega?: string | null;
  responsable_nombre: string;
  cliente: string;
  descripcion_producto: string;
  cantidad?: number | null;
  no_oc?: string | null;
  no_op?: string | null;
  estado?: string | null;
  fase?: string | null;
  no_factura?: string | null;
  observaciones?: string | null;
}
