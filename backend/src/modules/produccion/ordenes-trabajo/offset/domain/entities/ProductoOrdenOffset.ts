import { ProductoOrdenOffsetData } from './types';

export class ProductoOrdenOffset {
  public readonly id?: number;
  public readonly ordenTrabajoId: number;
  public readonly concepto?: string | null;
  public readonly cantidad?: number | null;
  public readonly tamanoAbierto?: string | null;
  public readonly tamanoCerrado?: string | null;
  public readonly material?: string | null;
  public readonly orden: number;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(data: ProductoOrdenOffsetData) {
    this.id = data.id;
    this.ordenTrabajoId = data.orden_trabajo_id;
    this.concepto = data.concepto;
    this.cantidad = data.cantidad;
    this.tamanoAbierto = data.tamano_abierto;
    this.tamanoCerrado = data.tamano_cerrado;
    this.material = data.material;
    this.orden = data.orden;
    this.createdAt = data.created_at ? new Date(data.created_at) : undefined;
    this.updatedAt = data.updated_at ? new Date(data.updated_at) : undefined;
  }

  toPersistence(): ProductoOrdenOffsetData {
    return {
      id: this.id,
      orden_trabajo_id: this.ordenTrabajoId,
      concepto: this.concepto,
      cantidad: this.cantidad,
      tamano_abierto: this.tamanoAbierto,
      tamano_cerrado: this.tamanoCerrado,
      material: this.material,
      orden: this.orden,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
