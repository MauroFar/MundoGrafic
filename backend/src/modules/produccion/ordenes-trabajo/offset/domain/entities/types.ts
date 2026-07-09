/**
 * Datos del detalle de una orden de trabajo OFFSET
 * Corresponde a la tabla: detalle_orden_trabajo_offset
 */
export interface DetalleOrdenOffsetData {
  id?: number;
  orden_trabajo_id: number;
  
  // Campos comunes
  material?: string | null;
  impresion?: string | null;
  observaciones?: string | null;
  
  // Campos específicos de proceso offset
  corte_material?: string | null;
  cantidad_pliegos_compra?: number | null;
  exceso?: number | null;
  pliegos_impresos?: number | null;
  tintas_frente?: string | null;
  tintas_reverso?: string | null;
  barniz?: string | null;
  terminados?: string | null;
  
  // Responsables del proceso offset (menos que digital, no tiene laminado/troquelado/liberación)
  vendedor?: string | null;
  preprensa?: string | null;
  prensa?: string | null;
  terminados_responsable?: string | null;
  facturado?: string | null;
  
  // Cantidades finales por responsable
  vendedor_cantidad_final?: string | null;
  preprensa_cantidad_final?: string | null;
  prensa_cantidad_final?: string | null;
  terminados_cantidad_final?: string | null;
  
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Datos de un producto de orden offset
 * Corresponde a la tabla: productos_orden_offset
 */
export interface ProductoOrdenOffsetData {
  id?: number;
  orden_trabajo_id: number;
  concepto?: string | null;
  cantidad?: number | null;
  tamano_abierto?: string | null;
  tamano_cerrado?: string | null;
  material?: string | null;
  orden: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Datos del catálogo de estados para órdenes offset
 * Corresponde a la tabla: estado_orden_offset
 */
export interface EstadoOrdenOffsetData {
  id: number;
  key: string;
  titulo: string;
  orden: number;
  color?: string | null;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Datos del historial de cambios de estado para órdenes offset
 * Corresponde a la tabla: estado_orden_offset_historial
 */
export interface EstadoOrdenOffsetHistorialData {
  id?: number;
  orden_trabajo_id: number;
  estado_id: number;
  usuario_id: number;
  fecha_cambio: Date;
  nota?: string | null;
  created_at?: Date;
}

export interface CreateDetalleOffsetInput {
  orden_trabajo_id: number;
  material?: string;
  impresion?: string;
  observaciones?: string;
  corte_material?: string;
  cantidad_pliegos_compra?: number;
  exceso?: number;
  pliegos_impresos?: number;
  tintas_frente?: string;
  tintas_reverso?: string;
  barniz?: string;
  terminados?: string;
}

export interface CreateProductoOffsetInput {
  orden_trabajo_id: number;
  concepto?: string;
  cantidad?: number;
  tamano_abierto?: string;
  tamano_cerrado?: string;
  material?: string;
  orden: number;
}
