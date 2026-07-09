import { OrdenTrabajoBaseData, TipoOrden } from '../../types';
import { TipoOrdenVO } from '../value-objects/TipoOrden';
import { NumeroOrden } from '../value-objects/NumeroOrden';

/**
 * Entidad Base: Orden de Trabajo
 * Representa los datos comunes entre órdenes digitales y offset
 */
export class OrdenTrabajoBase {
  public readonly id?: number;
  public readonly numeroOrden: NumeroOrden;
  public readonly tipoOrden: TipoOrdenVO;
  public readonly fecha: Date;
  public readonly clienteId: number;
  public readonly rucId?: number;
  public readonly cotizacionId?: number;
  public readonly artesAprobados: boolean;
  public readonly observaciones?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly createdBy?: number;
  public readonly updatedBy?: number;
  public readonly estadoOrdenDigitalId?: number | null;
  public readonly estadoOrdenOffsetId?: number | null;
  public readonly fechaInicioProduccion?: Date | null;
  public readonly fechaFinProduccion?: Date | null;
  public readonly diasProduccion?: number | null;

  constructor(data: OrdenTrabajoBaseData) {
    this.id = data.id;
    this.numeroOrden = NumeroOrden.fromString(data.numero_orden);
    this.tipoOrden = TipoOrdenVO.create(data.tipo_orden);
    this.fecha = new Date(data.fecha);
    this.clienteId = data.cliente_id;
    this.rucId = data.ruc_id;
    this.cotizacionId = data.cotizacion_id;
    this.artesAprobados = data.artes_aprobados ?? false;
    this.observaciones = data.observaciones;
    this.estadoOrdenDigitalId = data.estado_orden_digital_id ?? null;
    this.estadoOrdenOffsetId = data.estado_orden_offset_id ?? null;
    this.createdAt = data.created_at ? new Date(data.created_at) : undefined;
    this.updatedAt = data.updated_at ? new Date(data.updated_at) : undefined;
    this.createdBy = data.created_by;
    this.updatedBy = data.updated_by;
    this.fechaInicioProduccion = data.fecha_inicio_produccion 
      ? new Date(data.fecha_inicio_produccion) 
      : null;
    this.fechaFinProduccion = data.fecha_fin_produccion 
      ? new Date(data.fecha_fin_produccion) 
      : null;
    this.diasProduccion = data.dias_produccion ?? null;
  }

  /**
   * Convierte la entidad a formato de base de datos
   */
  toPersistence(): OrdenTrabajoBaseData {
    return {
      id: this.id,
      numero_orden: this.numeroOrden.getValue(),
      tipo_orden: this.tipoOrden.getValue(),
      fecha: this.fecha,
      cliente_id: this.clienteId,
      ruc_id: this.rucId,
      cotizacion_id: this.cotizacionId,
      artes_aprobados: this.artesAprobados,
      observaciones: this.observaciones,
      estado_orden_digital_id: this.estadoOrdenDigitalId,
      estado_orden_offset_id: this.estadoOrdenOffsetId,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      created_by: this.createdBy,
      updated_by: this.updatedBy,
      fecha_inicio_produccion: this.fechaInicioProduccion,
      fecha_fin_produccion: this.fechaFinProduccion,
      dias_produccion: this.diasProduccion,
    };
  }

  /**
   * Verifica si la orden es de tipo digital
   */
  isDigital(): boolean {
    return this.tipoOrden.isDigital();
  }

  /**
   * Verifica si la orden es de tipo offset
   */
  isOffset(): boolean {
    return this.tipoOrden.isOffset();
  }

  /**
   * Verifica si la orden tiene artes aprobados
   */
  hasArtesAprobados(): boolean {
    return this.artesAprobados === true;
  }

  /**
   * Verifica si la orden está vinculada a una cotización
   */
  hasVinculadaCotizacion(): boolean {
    return this.cotizacionId !== null && this.cotizacionId !== undefined;
  }
}
