import { DetalleOrdenDigitalData } from './types';

/**
 * Entidad: Detalle de Orden Digital
 * Representa los campos específicos del proceso de impresión digital
 */
export class DetalleOrdenDigital {
  public readonly id?: number;
  public readonly ordenTrabajoId: number;
  
  // Campos del material y proceso
  public readonly material?: string | null;
  public readonly impresion?: string | null;
  public readonly observaciones?: string | null;
  public readonly numeroSalida?: string | null;
  
  // Campos específicos digitales
  public readonly adherencia?: string | null;
  public readonly loteMaterial?: string | null;
  public readonly metrosImpresos?: number | null;
  public readonly tintasFrente?: string | null;
  public readonly tintasReverso?: string | null;
  public readonly materialReciclado?: boolean | null;
  public readonly terminados?: string | null;
  
  // Responsables (11 campos)
  public readonly vendedor?: string | null;
  public readonly preprensa?: string | null;
  public readonly prensa?: string | null;
  public readonly laminadoBarnizado?: string | null;
  public readonly troquelado?: string | null;
  public readonly terminadosResponsable?: string | null;
  public readonly facturado?: string | null;
  public readonly liberacionProducto?: string | null;
  
  // Cantidades finales
  public readonly vendedorCantidadFinal?: string | null;
  public readonly preprensaCantidadFinal?: string | null;
  public readonly prensaCantidadFinal?: string | null;
  public readonly laminadoBarnizadoCantidadFinal?: string | null;
  public readonly troqueladoCantidadFinal?: string | null;
  public readonly terminadosCantidadFinal?: string | null;
  public readonly liberacionProductoCantidadFinal?: string | null;
  
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(data: DetalleOrdenDigitalData) {
    this.id = data.id;
    this.ordenTrabajoId = data.orden_trabajo_id;
    this.material = data.material;
    this.impresion = data.impresion;
    this.observaciones = data.observaciones;
    this.numeroSalida = data.numero_salida;
    this.adherencia = data.adherencia;
    this.loteMaterial = data.lote_material;
    this.metrosImpresos = data.metros_impresos;
    this.tintasFrente = data.tintas_frente;
    this.tintasReverso = data.tintas_reverso;
    this.materialReciclado = data.material_reciclado;
    this.terminados = data.terminados;
    this.vendedor = data.vendedor;
    this.preprensa = data.preprensa;
    this.prensa = data.prensa;
    this.laminadoBarnizado = data.laminado_barnizado;
    this.troquelado = data.troquelado;
    this.terminadosResponsable = data.terminados_responsable;
    this.facturado = data.facturado;
    this.liberacionProducto = data.liberacion_producto;
    this.vendedorCantidadFinal = data.vendedor_cantidad_final;
    this.preprensaCantidadFinal = data.preprensa_cantidad_final;
    this.prensaCantidadFinal = data.prensa_cantidad_final;
    this.laminadoBarnizadoCantidadFinal = data.laminado_barnizado_cantidad_final;
    this.troqueladoCantidadFinal = data.troquelado_cantidad_final;
    this.terminadosCantidadFinal = data.terminados_cantidad_final;
    this.liberacionProductoCantidadFinal = data.liberacion_producto_cantidad_final;
    this.createdAt = data.created_at ? new Date(data.created_at) : undefined;
    this.updatedAt = data.updated_at ? new Date(data.updated_at) : undefined;
  }

  toPersistence(): DetalleOrdenDigitalData {
    return {
      id: this.id,
      orden_trabajo_id: this.ordenTrabajoId,
      material: this.material,
      impresion: this.impresion,
      observaciones: this.observaciones,
      numero_salida: this.numeroSalida,
      adherencia: this.adherencia,
      lote_material: this.loteMaterial,
      metros_impresos: this.metrosImpresos,
      tintas_frente: this.tintasFrente,
      tintas_reverso: this.tintasReverso,
      material_reciclado: this.materialReciclado,
      terminados: this.terminados,
      vendedor: this.vendedor,
      preprensa: this.preprensa,
      prensa: this.prensa,
      laminado_barnizado: this.laminadoBarnizado,
      troquelado: this.troquelado,
      terminados_responsable: this.terminadosResponsable,
      facturado: this.facturado,
      liberacion_producto: this.liberacionProducto,
      vendedor_cantidad_final: this.vendedorCantidadFinal,
      preprensa_cantidad_final: this.preprensaCantidadFinal,
      prensa_cantidad_final: this.prensaCantidadFinal,
      laminado_barnizado_cantidad_final: this.laminadoBarnizadoCantidadFinal,
      troquelado_cantidad_final: this.troqueladoCantidadFinal,
      terminados_cantidad_final: this.terminadosCantidadFinal,
      liberacion_producto_cantidad_final: this.liberacionProductoCantidadFinal,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
