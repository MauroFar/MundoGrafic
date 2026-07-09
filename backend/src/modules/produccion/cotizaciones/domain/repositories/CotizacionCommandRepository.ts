export interface CreateCotizacionInput {
  fecha: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  ruc_id: number;
  cliente_id: number;
  tiempo_entrega?: string | null;
  forma_pago?: string | null;
  validez_proforma?: string | null;
  observaciones?: string | null;
  contacto?: string | null;
  celuar?: string | null;
  nombre_ejecutivo?: string | null;
  userId: number;
  userNombre?: string | null;
}

export interface UpdateCotizacionInput {
  id: number;
  fecha: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  ruc_id: number;
  cliente_id: number;
  tiempo_entrega?: string | null;
  forma_pago?: string | null;
  validez_proforma?: string | null;
  observaciones?: string | null;
  contacto?: string | null;
  celuar?: string | null;
  nombre_ejecutivo?: string | null;
  updatedBy?: number;
}

export type UpdateCotizacionResult =
  | { type: "not_found" }
  | { type: "blocked" }
  | { type: "updated"; cotizacion: any };

export type DeleteCotizacionResult =
  | { type: "not_found" }
  | { type: "blocked" }
  | { type: "deleted" };

export type ChangeEstadoCotizacionResult =
  | { type: "not_found" }
  | { type: "updated"; cotizacion: any };

export interface CotizacionCommandRepository {
  createCotizacion(input: CreateCotizacionInput): Promise<any>;
  updateCotizacion(input: UpdateCotizacionInput): Promise<UpdateCotizacionResult>;
  deleteCotizacion(id: number): Promise<DeleteCotizacionResult>;
  approveCotizacion(id: number, observacion: string | null): Promise<ChangeEstadoCotizacionResult>;
  rejectCotizacion(id: number, motivo: string): Promise<ChangeEstadoCotizacionResult>;
}
