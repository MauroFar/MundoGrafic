/**
 * IOrdenLegacyRepository
 * ──────────────────────────────────────────────────────────────────────────
 * Contrato para las operaciones sobre orden_trabajo que aún usan el
 * esquema legacy (nombre_cliente, fecha_creacion, etc.).
 *
 * Separa la dependencia concreta de PgOrdenLegacyRepository de los use-cases,
 * permitiendo testing y sustitución futura sin romper la capa de aplicación.
 */

import {
  CreateOrdenLegacyInput,
  UpdateOrdenLegacyInput,
} from '../../infrastructure/persistence/PgOrdenLegacyRepository';

export interface IOrdenLegacyRepository {
  /** Crear registro base de la orden */
  create(input: CreateOrdenLegacyInput): Promise<{ id: number; numero_orden: string }>;

  /** Actualizar campos base de la orden */
  update(id: number, input: UpdateOrdenLegacyInput): Promise<any>;

  /** Obtener orden completa con JOINs (clientes, cotizaciones, estados, auditoria) */
  findByIdFull(id: number): Promise<any | null>;

  /** Eliminar la orden; retorna true si existía */
  delete(id: number): Promise<boolean>;

  /** Siguiente número de orden (e.g. OT-000042) */
  getProximoNumero(): Promise<string>;

  /** Listar con filtros y paginación */
  listar(filters: {
    busqueda?: string;
    concepto?: string;
    material?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    limite?: number;
    tipo_orden?: string;
    id_cotizacion?: number;
  }): Promise<any[]>;

  /** Marcar artes como aprobados y persistir fecha de entrega */
  aprobarArtes(id: number, fechaEntrega: string, userId: number | null): Promise<any>;

  /** Actualizar estado de producción de la orden */
  enviarAProduccion(
    id: number,
    estadoId: number,
    tipoOrden: string,
    observacion: string | null,
    userId: number | null,
  ): Promise<any>;

  /** Vincular cotización a la orden */
  vincularCotizacion(id: number, cotizacionId: number, userId: number | null): Promise<any>;

  /** Buscar cotizaciones que pueden vincularse (estado aprobado, sin OT) */
  getCotizacionesVinculables(busqueda?: string, limite?: number): Promise<any[]>;

  /** Verificar si la orden ya fue enviada a producción */
  fueEnviadaAProduccion(id: number): Promise<boolean>;
}
