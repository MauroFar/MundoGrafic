import { Client } from 'pg';
import { OrdenTrabajoBaseData, CreateOrdenBaseInput } from '../../types';

/**
 * Contrato: Repositorio de comandos (mutations) de órdenes
 * Solo operaciones de escritura en la tabla orden_trabajo
 */
export interface IOrdenCommandRepository {
  /**
   * Crear una nueva orden (solo registro base)
   */
  create(input: CreateOrdenBaseInput): Promise<OrdenTrabajoBaseData>;

  /**
   * Actualizar campos base de una orden
   */
  update(id: number, data: Partial<OrdenTrabajoBaseData>): Promise<OrdenTrabajoBaseData>;

  /**
   * Eliminar una orden (soft o hard delete según lógica de negocio)
   */
  delete(id: number): Promise<void>;

  /**
   * Vincular una cotización a una orden existente
   */
  vincularCotizacion(ordenId: number, cotizacionId: number, updatedBy: number): Promise<void>;

  /**
   * Marcar artes como aprobados
   */
  aprobarArtes(ordenId: number, updatedBy: number): Promise<void>;

  /**
   * Actualizar fechas de producción
   */
  updateFechasProduccion(
    ordenId: number, 
    fechaInicio?: Date | null, 
    fechaFin?: Date | null
  ): Promise<void>;
}
