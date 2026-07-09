/**
 * Datos del detalle de una orden de trabajo DIGITAL
 * Corresponde a la tabla: detalle_orden_trabajo_digital
 */
export interface DetalleOrdenDigitalData {
  id?: number;
  orden_trabajo_id: number;
  
  // Campos del material y proceso
  material?: string | null;
  impresion?: string | null;
  observaciones?: string | null;
  numero_salida?: string | null;
  
  // Campos específicos de proceso digital
  adherencia?: string | null;
  lote_material?: string | null;
  metros_impresos?: number | null;
  tintas_frente?: string | null;
  tintas_reverso?: string | null;
  material_reciclado?: boolean | null;
  terminados?: string | null;
  
  // Responsables del proceso digital (11 roles según migración 016)
  vendedor?: string | null;
  preprensa?: string | null;
  prensa?: string | null;
  laminado_barnizado?: string | null;
  troquelado?: string | null;
  terminados_responsable?: string | null; // campo responsable
  facturado?: string | null;
  liberacion_producto?: string | null;
  
  // Cantidades finales por responsable
  vendedor_cantidad_final?: string | null;
  preprensa_cantidad_final?: string | null;
  prensa_cantidad_final?: string | null;
  laminado_barnizado_cantidad_final?: string | null;
  troquelado_cantidad_final?: string | null;
  terminados_cantidad_final?: string | null;
  liberacion_producto_cantidad_final?: string | null;
  
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Datos de un producto de orden digital
 * Corresponde a la tabla: productos_orden_digital
 * Una orden digital puede tener múltiples productos (relación 1:N)
 */
export interface ProductoOrdenDigitalData {
  id?: number;
  orden_trabajo_id: number;
  concepto?: string | null;
  cantidad?: number | null;
  tamano_abierto?: string | null;
  tamano_cerrado?: string | null;
  material?: string | null;
  orden: number; // Orden de visualización
  numero_salida?: string | null; // Agregado en migración 003
  avance?: number | null; // Porcentaje de avance del producto
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Datos del catálogo de estados para órdenes digitales
 * Corresponde a la tabla: estado_orden_digital
 */
export interface EstadoOrdenDigitalData {
  id: number;
  key: string; // Estado canónico (en_preprensa, en_prensa, etc.)
  titulo: string; // Título display para UI
  orden: number; // Orden de secuencia del flujo
  color?: string | null; // Color hex para UI
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Datos del historial de cambios de estado para órdenes digitales
 * Corresponde a la tabla: estado_orden_digital_historial
 */
export interface EstadoOrdenDigitalHistorialData {
  id?: number;
  orden_trabajo_id: number;
  estado_id: number; // FK a estado_orden_digital
  usuario_id: number;
  fecha_cambio: Date;
  nota?: string | null; // Agregado en migración 019
  created_at?: Date;
}

/**
 * Input para crear un detalle digital
 */
export interface CreateDetalleDigitalInput {
  orden_trabajo_id: number;
  material?: string;
  impresion?: string;
  observaciones?: string;
  numero_salida?: string;
  adherencia?: string;
  lote_material?: string;
  metros_impresos?: number;
  tintas_frente?: string;
  tintas_reverso?: string;
  material_reciclado?: boolean;
  terminados?: string;
}

/**
 * Input para crear un producto digital
 */
export interface CreateProductoDigitalInput {
  orden_trabajo_id: number;
  concepto?: string;
  cantidad?: number;
  tamano_abierto?: string;
  tamano_cerrado?: string;
  material?: string;
  orden: number;
  numero_salida?: string;
  avance?: number;
}
