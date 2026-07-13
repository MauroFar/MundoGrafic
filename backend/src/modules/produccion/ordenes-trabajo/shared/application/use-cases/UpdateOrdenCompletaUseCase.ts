import { IOrdenLegacyRepository } from '../../domain/repositories/IOrdenLegacyRepository';
import { PgOrdenDigitalRepository, UpsertDetalleDigitalInput } from '../../../digital/infrastructure/persistence/PgOrdenDigitalRepository';
import { PgOrdenOffsetRepository, UpsertDetalleOffsetInput } from '../../../offset/infrastructure/persistence/PgOrdenOffsetRepository';

export interface UpdateOrdenCompletaDeps {
  ordenRepo: IOrdenLegacyRepository;
  detalleDigitalRepo: PgOrdenDigitalRepository;
  detalleOffsetRepo: PgOrdenOffsetRepository;
  runInTransaction: <T>(fn: () => Promise<T>) => Promise<T>;
}

export class UpdateOrdenCompletaUseCase {
  constructor(private readonly deps: UpdateOrdenCompletaDeps) {}

  async execute(id: number, body: any, userId: number): Promise<any> {
    const {
      nombre_cliente, orden_compra, concepto, fecha_creacion, fecha_entrega,
      artes_aprobados, telefono, email, contacto, cantidad, notas_observaciones,
      vendedor, preprensa, prensa, terminados, facturado, laminado_barnizado, troquelado,
      liberacion_producto, preprensa_responsable, impresion_responsable, laminado_responsable,
      barnizado_responsable, troquelado_flexible_responsable, troquelado_plano_responsable,
      rebobinado_responsable, refilado_termoencogible_responsable, sellado_termoencogible_responsable,
      corte_termoencogible_responsable, terminado_responsable,
      vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final,
      laminado_barnizado_cantidad_final, troquelado_cantidad_final, terminados_cantidad_final,
      liberacion_producto_cantidad_final, id_detalle_cotizacion, tipo_orden, detalle,
    } = body;

    const artesAprobados = artes_aprobados === undefined ? null : Boolean(artes_aprobados);
    const fechaEntregaPersistida = artesAprobados === false ? null : fecha_entrega;

    return this.deps.runInTransaction(async () => {
      const ordenActualizada = await this.deps.ordenRepo.update(id, {
        nombre_cliente,
        orden_compra: orden_compra ?? null,
        contacto: contacto ?? null,
        email: email ?? null,
        telefono: telefono ?? null,
        fecha_creacion: fecha_creacion ?? null,
        fecha_entrega: fechaEntregaPersistida ?? null,
        notas_observaciones: notas_observaciones ?? null,
        id_detalle_cotizacion: id_detalle_cotizacion ?? null,
        tipo_orden,
        artes_aprobados: artesAprobados ?? undefined,
        updated_by: userId,
      });

      if (!ordenActualizada) throw new Error('Orden no encontrada');

      if (tipo_orden === 'digital') {
        const detalleInput: UpsertDetalleDigitalInput = {
          orden_trabajo_id: id,
          adherencia: detalle?.adherencia,
          lote_material: detalle?.lote_material,
          lote_produccion: detalle?.lote_produccion,
          tipo_impresion: detalle?.tipo_impresion,
          troquel: detalle?.troquel,
          codigo_troquel: detalle?.codigo_troquel,
          terminado_etiqueta: detalle?.terminado_etiqueta,
          terminados_especiales: detalle?.terminados_especiales,
          cantidad_por_rollo: detalle?.cantidad_por_rollo,
          proveedor_material: detalle?.proveedor_material,
          espesor: detalle?.espesor,
          material: detalle?.material,
          impresion: detalle?.impresion,
          observaciones: detalle?.observaciones,
          numero_salida: detalle?.numero_salida,
          trazabilidad_proceso: detalle?.trazabilidad_proceso,
          vendedor: vendedor,
          preprensa_responsable: preprensa_responsable || preprensa,
          impresion_responsable: impresion_responsable || prensa,
          laminado_responsable: laminado_responsable || laminado_barnizado,
          barnizado_responsable: barnizado_responsable,
          troquelado_flexible_responsable: troquelado_flexible_responsable || troquelado,
          troquelado_plano_responsable: troquelado_plano_responsable,
          rebobinado_responsable: rebobinado_responsable,
          refilado_termoencogible_responsable: refilado_termoencogible_responsable,
          sellado_termoencogible_responsable: sellado_termoencogible_responsable,
          corte_termoencogible_responsable: corte_termoencogible_responsable,
          terminado_responsable: terminado_responsable || terminados,
          liberacion_producto: liberacion_producto,
          facturado: facturado,
          vendedor_cantidad_final: vendedor_cantidad_final,
          preprensa_cantidad_final: preprensa_cantidad_final,
          prensa_cantidad_final: prensa_cantidad_final,
          laminado_barnizado_cantidad_final: laminado_barnizado_cantidad_final,
          troquelado_cantidad_final: troquelado_cantidad_final,
          terminados_cantidad_final: terminados_cantidad_final,
          liberacion_producto_cantidad_final: liberacion_producto_cantidad_final,
        };
        await this.deps.detalleDigitalRepo.upsertDetalleCompleto(detalleInput);
        await this.deps.detalleDigitalRepo.deleteProductosByOrden(id);
        await this._insertProductosDigital(id, detalle?.productos_digital);
      } else {
        const detalleInput: UpsertDetalleOffsetInput = {
          orden_trabajo_id: id,
          corte_material: detalle?.corte_material,
          cantidad_pliegos_compra: detalle?.cantidad_pliegos_compra,
          exceso: detalle?.exceso,
          total_pliegos: detalle?.total_pliegos,
          tamano: detalle?.tamano,
          tamano_abierto_1: detalle?.tamano_abierto_1,
          tamano_cerrado_1: detalle?.tamano_cerrado_1,
          instrucciones_impresion: detalle?.instrucciones_impresion,
          instrucciones_acabados: detalle?.instrucciones_acabados,
          instrucciones_empacado: detalle?.instrucciones_empacado,
          material: detalle?.material,
          impresion: detalle?.impresion,
          observaciones: detalle?.observaciones,
          numero_salida: detalle?.numero_salida,
          trazabilidad_proceso: detalle?.trazabilidad_proceso,
          vendedor: vendedor,
          preprensa: preprensa,
          prensa: prensa,
          terminados: terminados,
          facturado: facturado,
          vendedor_cantidad_final: vendedor_cantidad_final,
          preprensa_cantidad_final: preprensa_cantidad_final,
          prensa_cantidad_final: prensa_cantidad_final,
          terminados_cantidad_final: terminados_cantidad_final,
        };
        await this.deps.detalleOffsetRepo.upsertDetalleCompleto(detalleInput);
        await this.deps.detalleOffsetRepo.deleteProductosByOrden(id);
        await this._insertProductosOffset(id, detalle?.productos_offset, concepto, cantidad);
      }

      return ordenActualizada;
    });
  }

  private async _insertProductosDigital(ordenId: number, productos: any[]): Promise<void> {
    if (!Array.isArray(productos) || !productos.length) return;
    for (let i = 0; i < productos.length; i++) {
      const p = productos[i];
      await this.deps.detalleDigitalRepo.createProductoFull({
        orden_trabajo_id: ordenId,
        orden: i + 1,
        cantidad: p.cantidad ?? null,
        cod_mg: p.cod_mg ?? null,
        cod_cliente: p.cod_cliente ?? null,
        producto: p.producto ?? null,
        avance: p.avance ?? null,
        medida_ancho: p.medida_ancho ?? null,
        medida_alto: p.medida_alto ?? null,
        cavidad: p.cavidad ?? null,
        metros_impresos: p.metros_impresos ?? null,
        gap_horizontal: p.gap_horizontal ?? null,
        gap_vertical: p.gap_vertical ?? null,
        tamano_papel_ancho: p.tamano_papel_ancho ?? null,
        tamano_papel_largo: p.tamano_papel_largo ?? null,
        numero_salida: p.numero_salida ?? null,
      });
    }
  }

  private async _insertProductosOffset(
    ordenId: number,
    productos: any[],
    concepto: any,
    cantidad: any,
  ): Promise<void> {
    if (Array.isArray(productos) && productos.length) {
      for (let i = 0; i < productos.length; i++) {
        const p = productos[i];
        await this.deps.detalleOffsetRepo.createProductoFull({
          orden_trabajo_id: ordenId,
          orden: i + 1,
          concepto: p.concepto ?? null,
          cantidad: p.cantidad ?? null,
          tamano_abierto: p.tamano_abierto ?? null,
          tamano_cerrado: p.tamano_cerrado ?? null,
          material: p.material ?? null,
        });
      }
    } else if (concepto || cantidad) {
      await this.deps.detalleOffsetRepo.createProductoFull({
        orden_trabajo_id: ordenId,
        orden: 1,
        concepto: concepto ?? null,
        cantidad: cantidad ?? null,
      });
    }
  }
}
