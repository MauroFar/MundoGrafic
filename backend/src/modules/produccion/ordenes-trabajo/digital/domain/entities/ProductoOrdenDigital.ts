import { ProductoOrdenDigitalData } from './types';

/**
 * Entidad: Producto de Orden Digital
 * Representa un producto individual dentro de una orden digital
 * Una orden puede tener múltiples productos (1:N)
 */
export class ProductoOrdenDigital {
  public readonly id?: number;
  public readonly ordenTrabajoId: number;
  public readonly concepto?: string | null;
  public readonly cantidad?: number | null;
  public readonly tamanoAbierto?: string | null;
  public readonly tamanoCerrado?: string | null;
  public readonly material?: string | null;
  public readonly orden: number;
  public readonly numeroSalida?: string | null;
  public readonly avance?: number | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(data: ProductoOrdenDigitalData) {
    this.id = data.id;
    this.ordenTrabajoId = data.orden_trabajo_id;
    this.concepto = data.concepto;
    this.cantidad = data.cantidad;
    this.tamanoAbierto = data.tamano_abierto;
    this.tamanoCerrado = data.tamano_cerrado;
    this.material = data.material;
    this.orden = data.orden;
    this.numeroSalida = data.numero_salida;
    this.avance = data.avance ?? 0;
    this.createdAt = data.created_at ? new Date(data.created_at) : undefined;
    this.updatedAt = data.updated_at ? new Date(data.updated_at) : undefined;
  }

  toPersistence(): ProductoOrdenDigitalData {
    return {
      id: this.id,
      orden_trabajo_id: this.ordenTrabajoId,
      concepto: this.concepto,
      cantidad: this.cantidad,
      tamano_abierto: this.tamanoAbierto,
      tamano_cerrado: this.tamanoCerrado,
      material: this.material,
      orden: this.orden,
      numero_salida: this.numeroSalida,
      avance: this.avance,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  /**
   * Verifica si el producto tiene un avance completado (100%)
   */
  isCompleted(): boolean {
    return this.avance !== null && this.avance >= 100;
  }

  /**
   * Calcula el porcentaje de avance como número entre 0 y 100
   */
  getAvancePercentage(): number {
    if (this.avance === null || this.avance === undefined) return 0;
    return Math.min(100, Math.max(0, this.avance));
  }
}
