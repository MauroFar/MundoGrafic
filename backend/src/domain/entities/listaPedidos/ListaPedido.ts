export const TIPOS_PERMITIDOS = ["offset", "digital"] as const;
export type TipoPedido = (typeof TIPOS_PERMITIDOS)[number];

export const ESTADOS_PERMITIDOS = [
  "Sin empezar",
  "En proceso",
  "Atrasado",
  "Completo",
  "Rechazado",
] as const;

export const FASES_PERMITIDAS = [
  "Aprobacion de ficha tecnica",
  "Preprensa",
  "Guillotinado",
  "Prensa",
  "Barnizado",
  "Plastificado",
  "Troquelado",
  "Pegado",
  "Terminados MG",
  "Terminados externos",
  "Empaque",
  "Liberado",
  "Facturado",
  "Entregado",
  "Entrega incompleta",
] as const;

export type EstadoPedido = (typeof ESTADOS_PERMITIDOS)[number];
export type FasePedido   = (typeof FASES_PERMITIDAS)[number];

export interface ListaPedido {
  id: number;
  tipo: TipoPedido;
  fecha_ingreso_pedido: string;
  fecha_entrega: string | null;
  responsable_nombre: string;
  cliente: string;
  descripcion_producto: string;
  cantidad: number;
  no_oc: string | null;
  no_op: string | null;
  estado: string;
  fase: string | null;
  no_factura: string | null;
  observaciones: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ListaPedidoCreateInput {
  tipo: TipoPedido;
  fecha_ingreso_pedido: string;
  fecha_entrega: string | null;
  responsable_nombre: string;
  cliente: string;
  descripcion_producto: string;
  cantidad: number;
  no_oc: string | null;
  no_op: string | null;
  estado: string;
  fase: string | null;
  no_factura: string | null;
  observaciones: string | null;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ListaPedidoUpdateInput extends ListaPedidoCreateInput {
  id: number;
}

/** Normaliza texto para comparación de catálogos */
export function normalizeCatalog(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}
