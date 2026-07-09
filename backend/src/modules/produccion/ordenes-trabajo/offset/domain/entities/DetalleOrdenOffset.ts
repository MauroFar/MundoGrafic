import { DetalleOrdenOffsetData } from './types';

export class DetalleOrdenOffset {
  public readonly id?: number;
  public readonly ordenTrabajoId: number;
  public readonly material?: string | null;
  public readonly impresion?: string | null;
  public readonly observaciones?: string | null;
  public readonly corteMaterial?: string | null;
  public readonly cantidadPliegosCompra?: number | null;
  public readonly exceso?: number | null;
  public readonly pliegosImpresos?: number | null;
  public readonly tintasFrente?: string | null;
  public readonly tintasReverso?: string | null;
  public readonly barniz?: string | null;
  public readonly terminados?: string | null;
  public readonly vendedor?: string | null;
  public readonly preprensa?: string | null;
  public readonly prensa?: string | null;
  public readonly terminadosResponsable?: string | null;
  public readonly facturado?: string | null;
  public readonly vendedorCantidadFinal?: string | null;
  public readonly preprensaCantidadFinal?: string | null;
  public readonly prensaCantidadFinal?: string | null;
  public readonly terminadosCantidadFinal?: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(data: DetalleOrdenOffsetData) {
    this.id = data.id;
    this.ordenTrabajoId = data.orden_trabajo_id;
    this.material = data.material;
    this.impresion = data.impresion;
    this.observaciones = data.observaciones;
    this.corteMaterial = data.corte_material;
    this.cantidadPliegosCompra = data.cantidad_pliegos_compra;
    this.exceso = data.exceso;
    this.pliegosImpresos = data.pliegos_impresos;
    this.tintasFrente = data.tintas_frente;
    this.tintasReverso = data.tintas_reverso;
    this.barniz = data.barniz;
    this.terminados = data.terminados;
    this.vendedor = data.vendedor;
    this.preprensa = data.preprensa;
    this.prensa = data.prensa;
    this.terminadosResponsable = data.terminados_responsable;
    this.facturado = data.facturado;
    this.vendedorCantidadFinal = data.vendedor_cantidad_final;
    this.preprensaCantidadFinal = data.preprensa_cantidad_final;
    this.prensaCantidadFinal = data.prensa_cantidad_final;
    this.terminadosCantidadFinal = data.terminados_cantidad_final;
    this.createdAt = data.created_at ? new Date(data.created_at) : undefined;
    this.updatedAt = data.updated_at ? new Date(data.updated_at) : undefined;
  }

  toPersistence(): DetalleOrdenOffsetData {
    return {
      id: this.id,
      orden_trabajo_id: this.ordenTrabajoId,
      material: this.material,
      impresion: this.impresion,
      observaciones: this.observaciones,
      corte_material: this.corteMaterial,
      cantidad_pliegos_compra: this.cantidadPliegosCompra,
      exceso: this.exceso,
      pliegos_impresos: this.pliegosImpresos,
      tintas_frente: this.tintasFrente,
      tintas_reverso: this.tintasReverso,
      barniz: this.barniz,
      terminados: this.terminados,
      vendedor: this.vendedor,
      preprensa: this.preprensa,
      prensa: this.prensa,
      terminados_responsable: this.terminadosResponsable,
      facturado: this.facturado,
      vendedor_cantidad_final: this.vendedorCantidadFinal,
      preprensa_cantidad_final: this.preprensaCantidadFinal,
      prensa_cantidad_final: this.prensaCantidadFinal,
      terminados_cantidad_final: this.terminadosCantidadFinal,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
