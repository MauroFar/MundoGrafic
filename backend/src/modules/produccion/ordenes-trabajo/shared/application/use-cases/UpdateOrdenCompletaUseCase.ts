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
    const hasField = (field: string) => Object.prototype.hasOwnProperty.call(body, field);
    const pick = (field: string) => (hasField(field) ? body[field] : undefined);

    const {
      nombre_cliente, concepto, fecha_creacion,
      telefono, email, contacto, cantidad, notas_observaciones,
      vendedor, preprensa, prensa, terminados, facturado, laminado_barnizado, troquelado,
      liberacion_producto, preprensa_responsable, impresion_responsable, laminado_responsable,
      barnizado_responsable, troquelado_flexible_responsable, troquelado_plano_responsable,
      rebobinado_responsable, refilado_termoencogible_responsable, sellado_termoencogible_responsable,
      corte_termoencogible_responsable, terminado_responsable,
      vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final,
      laminado_barnizado_cantidad_final, troquelado_cantidad_final, terminados_cantidad_final,
      liberacion_producto_cantidad_final, id_detalle_cotizacion, tipo_orden, detalle,
    } = body;

    const ordenCompra = pick('orden_compra');
    const fechaEntrega = pick('fecha_entrega');
    const artesAprobadosBody = pick('artes_aprobados');
    const fechaAprobacionArtesBody = pick('fecha_aprobacion_artes');
    const artesAprobados = artesAprobadosBody === undefined ? undefined : Boolean(artesAprobadosBody);
    const fechaEntregaPersistida = fechaEntrega === undefined
      ? undefined
      : (artesAprobados === false ? null : (fechaEntrega === null ? null : String(fechaEntrega).slice(0, 10)));
    const tienePayloadDetalle = Boolean(
      body.detalle !== undefined ||
      ['material','corte_material','cantidad_pliegos_compra','exceso','total_pliegos','tamano','tamano_abierto_1','tamano_cerrado_1','instrucciones_impresion','instrucciones_acabados','instrucciones_empacado','codigo_producto','impresion','observaciones','numero_salida','prensa_seleccionada','trazabilidad_proceso','estilo_secciones_offset','adherencia','lote_material','lote_produccion','tipo_impresion','troquel','codigo_troquel','terminado_etiqueta','terminados_especiales','cantidad_por_rollo','proveedor_material','espesor','vendedor','preprensa','prensa','terminados','facturado','vendedor_cantidad_final','preprensa_cantidad_final','prensa_cantidad_final','terminados_cantidad_final','laminado_barnizado','troquelado','liberacion_producto','laminado_responsable','barnizado_responsable','troquelado_flexible_responsable','troquelado_plano_responsable','rebobinado_responsable','refilado_termoencogible_responsable','sellado_termoencogible_responsable','corte_termoencogible_responsable','terminado_responsable','preprensa_responsable','impresion_responsable','terminados_externos_responsable','productos_digital','productos_offset']
        .some((campo) => Object.prototype.hasOwnProperty.call(body, campo))
    );
    // Respetar la fecha enviada desde el frontend si está presente; si no,
    // mantener la lógica anterior (undefined cuando no se incluye el campo,
    // la fecha actual cuando se aprueban artes y no se envía fecha, o null si se desaprueba).
    const fechaAprobacionArtesPersistida =
      fechaAprobacionArtesBody !== undefined
        ? (fechaAprobacionArtesBody === null ? null : String(fechaAprobacionArtesBody).slice(0, 10))
        : (artesAprobadosBody === undefined
            ? undefined
            : artesAprobados === true
              ? new Date().toISOString().slice(0, 10)
              : null);

    return this.deps.runInTransaction(async () => {
      const ordenActualizada = await this.deps.ordenRepo.update(id, {
        nombre_cliente: hasField('nombre_cliente') ? nombre_cliente : undefined,
        orden_compra: hasField('orden_compra') ? (ordenCompra ?? null) : undefined,
        contacto: hasField('contacto') ? (contacto ?? null) : undefined,
        email: hasField('email') ? (email ?? null) : undefined,
        telefono: hasField('telefono') ? (telefono ?? null) : undefined,
        fecha_creacion: hasField('fecha_creacion') ? (fecha_creacion ?? null) : undefined,
        fecha_entrega: fechaEntregaPersistida,
        fecha_aprobacion_artes: fechaAprobacionArtesPersistida,
        notas_observaciones: hasField('notas_observaciones') ? (notas_observaciones ?? null) : undefined,
        id_detalle_cotizacion: hasField('id_detalle_cotizacion') ? (id_detalle_cotizacion ?? null) : undefined,
        tipo_orden: hasField('tipo_orden') ? tipo_orden : undefined,
        artes_aprobados: artesAprobadosBody === undefined ? undefined : (artesAprobados ?? null),
        updated_by: userId,
      });

      if (!ordenActualizada) throw new Error('Orden no encontrada');

      if (!tienePayloadDetalle) {
        return ordenActualizada;
      }

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
          tamano_pliego: detalle?.tamano_pliego,
          cabida_producto: detalle?.cabida_producto,
          guillotina_tamano_corte: detalle?.guillotina_tamano_corte,
          guillotina_cabida_corte: detalle?.cabida_corte,
          prensas_pliegos_imprimir: detalle?.formatos_a_imprimir,
          prensas_cabida_impresion: detalle?.cabida_imp_formato,
          prensas_total_impresion: detalle?.total_impresion,
          tamano: detalle?.tamano,
          tamano_abierto_1: detalle?.tamano_abierto_1,
          tamano_cerrado_1: detalle?.tamano_cerrado_1,
          instrucciones_impresion: detalle?.instrucciones_impresion,
          instrucciones_acabados: detalle?.instrucciones_acabados,
          instrucciones_empacado: detalle?.instrucciones_empacado,
          material: detalle?.material,
          codigo_producto: detalle?.codigo_producto,
          impresion: detalle?.impresion,
          observaciones: detalle?.observaciones,
          numero_salida: detalle?.numero_salida,
          prensa_seleccionada: detalle?.prensa_seleccionada ?? null,
          trazabilidad_proceso: detalle?.trazabilidad_proceso,
          estilo_secciones_offset: detalle?.estilo_secciones_offset ?? null,
          vendedor: vendedor,
          preprensa: preprensa ?? preprensa_responsable,
          prensa: prensa ?? impresion_responsable,
          terminados: terminados ?? terminado_responsable,
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
        info_tecnica: p.info_tecnica ?? null,
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
