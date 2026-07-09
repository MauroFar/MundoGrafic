export interface DetalleImagenInput {
  imagen_ruta: string;
  imagen_width?: number;
  imagen_height?: number;
  imagen_rotacion?: number;
}

export interface DetalleEscalaInput {
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
  orden?: number;
}

export interface CreateCotizacionDetalleInput {
  cotizacion_id: number;
  cantidad?: number | string;
  detalle: string;
  valor_unitario?: number;
  valor_total?: number;
  imagenes?: DetalleImagenInput[];
  alineacion_imagenes?: string;
  posicion_imagen?: string;
  texto_negrita?: boolean;
  usa_escalas?: boolean;
  escalas?: DetalleEscalaInput[];
}

export interface ReplaceCotizacionDetallesInput {
  cotizacionId: number;
  detalles: CreateCotizacionDetalleInput[];
}

export interface CotizacionDetalleRepository {
  getDetallesByCotizacionId(cotizacionId: number): Promise<any[]>;
  createDetalle(input: CreateCotizacionDetalleInput): Promise<any>;
  replaceDetalles(input: ReplaceCotizacionDetallesInput): Promise<any[]>;
}
