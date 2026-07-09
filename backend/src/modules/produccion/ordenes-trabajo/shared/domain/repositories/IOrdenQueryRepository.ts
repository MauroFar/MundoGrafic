import { Client } from 'pg';
import { OrdenTrabajoBase } from '../entities/OrdenTrabajoBase';
import { OrdenSearchFilters } from '../../types';

/**
 * Contrato: Repositorio de consultas (queries) de órdenes
 * Solo operaciones de lectura
 */
export interface IOrdenQueryRepository {
  /**
   * Buscar órdenes con filtros
   */
  findByFilters(filters: OrdenSearchFilters): Promise<OrdenTrabajoBase[]>;

  /**
   * Obtener orden por ID (solo datos base, sin detalles)
   */
  findById(id: number): Promise<OrdenTrabajoBase | null>;

  /**
   * Obtener orden por número de orden
   */
  findByNumero(numeroOrden: string): Promise<OrdenTrabajoBase | null>;

  /**
   * Obtener el último número de orden existente
   */
  getLastNumeroOrden(): Promise<string | null>;

  /**
   * Verificar si una orden existe
   */
  exists(id: number): Promise<boolean>;
}
