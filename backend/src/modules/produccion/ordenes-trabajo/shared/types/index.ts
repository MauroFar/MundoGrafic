/**
 * Tipo de orden de trabajo
 * Determina qué tablas de detalles y productos usar
 */
export type TipoOrden = 'digital' | 'offset';

/**
 * Estados canónicos compartidos entre digital y offset
 */
export type EstadoCanonicoKey = 
  | 'en_preprensa'
  | 'en_prensa'
  | 'laminado'
  | 'troquelado'
  | 'terminados'
  | 'liberado'
  | 'entregado'
  | 'cancelado';

/**
 * Interfaz base para catálogo de estados
 */
export interface EstadoBase {
  id: number;
  key: string;
  titulo: string;
  orden: number;
  color?: string;
  activo: boolean;
}

/**
 * Interfaz base para historial de estados
 */
export interface EstadoHistorialBase {
  id: number;
  orden_trabajo_id: number;
  estado_id: number;
  usuario_id: number;
  fecha_cambio: Date;
  nota?: string;
  created_at: Date;
}

/**
 * Datos comunes de una orden de trabajo (independiente del tipo)
 */
export interface OrdenTrabajoBaseData {
  id?: number;
  numero_orden: string;
  tipo_orden: TipoOrden;
  fecha: Date;
  cliente_id: number;
  ruc_id?: number;
  cotizacion_id?: number;
  artes_aprobados?: boolean;
  observaciones?: string;
  estado_orden_digital_id?: number | null;
  estado_orden_offset_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
  
  // Campos de auditoría
  created_by?: number;
  updated_by?: number;
  
  // Campos de producción (agregados en migración 012)
  fecha_inicio_produccion?: Date | null;
  fecha_fin_produccion?: Date | null;
  dias_produccion?: number | null;
}

/**
 * Datos mínimos para crear una orden
 */
export interface CreateOrdenBaseInput {
  tipo_orden: TipoOrden;
  fecha: Date;
  cliente_id: number;
  ruc_id?: number;
  cotizacion_id?: number;
  artes_aprobados?: boolean;
  observaciones?: string;
  estado_orden_digital_id?: number | null;
  estado_orden_offset_id?: number | null;
  created_by: number;
}

/**
 * Filtros para búsqueda de órdenes
 */
export interface OrdenSearchFilters {
  tipo_orden?: TipoOrden;
  numero_orden?: string;
  cliente_id?: number;
  ruc_id?: number;
  busqueda?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  estado?: string;
  artes_aprobados?: boolean;
}
