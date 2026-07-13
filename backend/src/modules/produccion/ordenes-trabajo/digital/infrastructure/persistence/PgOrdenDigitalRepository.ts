import { Client } from 'pg';
import { DetalleOrdenDigitalData, CreateDetalleDigitalInput } from '../../domain/entities/types';

/**
 * Tipos extendidos para el upsert completo desde los use-cases
 */
export interface UpsertDetalleDigitalInput {
  orden_trabajo_id: number;
  // Campos de detalle técnico
  adherencia?: string | null;
  lote_material?: string | null;
  lote_produccion?: string | null;
  tipo_impresion?: string | null;
  troquel?: string | null;
  codigo_troquel?: string | null;
  terminado_etiqueta?: string | null;
  terminados_especiales?: string | null;
  cantidad_por_rollo?: string | null;
  proveedor_material?: string | null;
  espesor?: string | null;
  material?: string | null;
  impresion?: string | null;
  observaciones?: string | null;
  numero_salida?: string | null;
  trazabilidad_proceso?: any;
  // Responsables
  vendedor?: string | null;
  preprensa_responsable?: string | null;
  impresion_responsable?: string | null;
  laminado_responsable?: string | null;
  barnizado_responsable?: string | null;
  troquelado_flexible_responsable?: string | null;
  troquelado_plano_responsable?: string | null;
  rebobinado_responsable?: string | null;
  refilado_termoencogible_responsable?: string | null;
  sellado_termoencogible_responsable?: string | null;
  corte_termoencogible_responsable?: string | null;
  terminado_responsable?: string | null;
  liberacion_producto?: string | null;
  facturado?: string | null;
  // Cantidades finales
  vendedor_cantidad_final?: string | null;
  preprensa_cantidad_final?: string | null;
  prensa_cantidad_final?: string | null;
  laminado_barnizado_cantidad_final?: string | null;
  troquelado_cantidad_final?: string | null;
  terminados_cantidad_final?: string | null;
  liberacion_producto_cantidad_final?: string | null;
}

export interface CreateProductoDigitalFullInput {
  orden_trabajo_id: number;
  orden: number;
  cantidad?: number | null;
  cod_mg?: string | null;
  cod_cliente?: string | null;
  producto?: string | null;
  avance?: number | null;
  medida_ancho?: string | null;
  medida_alto?: string | null;
  cavidad?: number | null;
  metros_impresos?: number | null;
  gap_horizontal?: string | null;
  gap_vertical?: string | null;
  tamano_papel_ancho?: string | null;
  tamano_papel_largo?: string | null;
  numero_salida?: string | null;
}

export class PgOrdenDigitalRepository {
  constructor(private readonly client: Client) {}

  // ─── DETALLE SIMPLE (usado por use-cases de lectura/creación unitaria) ─────

  async createDetalle(input: CreateDetalleDigitalInput): Promise<DetalleOrdenDigitalData> {
    const result = await this.client.query(
      `INSERT INTO detalle_orden_trabajo_digital (
        orden_trabajo_id, material, impresion, observaciones, numero_salida,
        adherencia, lote_material, metros_impresos, tintas_frente, tintas_reverso,
        material_reciclado, terminados, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *`,
      [
        input.orden_trabajo_id,
        input.material || null,
        input.impresion || null,
        input.observaciones || null,
        input.numero_salida || null,
        input.adherencia || null,
        input.lote_material || null,
        input.metros_impresos || null,
        input.tintas_frente || null,
        input.tintas_reverso || null,
        input.material_reciclado || false,
        input.terminados || null,
      ],
    );
    return result.rows[0];
  }

  async findDetalleByOrdenId(ordenTrabajoId: number): Promise<DetalleOrdenDigitalData | null> {
    const result = await this.client.query(
      'SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1',
      [ordenTrabajoId],
    );
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  // ─── UPSERT COMPLETO (usado por CreateOrdenCompletaUseCase y UpdateOrdenCompletaUseCase) ─

  async upsertDetalleCompleto(input: UpsertDetalleDigitalInput): Promise<void> {
    const v = input;
    const trazJson = v.trazabilidad_proceso ? JSON.stringify(v.trazabilidad_proceso) : null;

    await this.client.query(
      `INSERT INTO detalle_orden_trabajo_digital (
        orden_trabajo_id, adherencia, lote_material, lote_produccion, tipo_impresion,
        troquel, codigo_troquel, terminado_etiqueta, terminados_especiales, cantidad_por_rollo,
        proveedor_material, espesor, material, impresion, observaciones, numero_salida,
        vendedor, preprensa_responsable, impresion_responsable, laminado_responsable, barnizado_responsable,
        troquelado_flexible_responsable, troquelado_plano_responsable, rebobinado_responsable,
        refilado_termoencogible_responsable, sellado_termoencogible_responsable,
        corte_termoencogible_responsable, terminado_responsable, liberacion_producto, facturado,
        vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final,
        laminado_barnizado_cantidad_final, troquelado_cantidad_final, terminados_cantidad_final,
        liberacion_producto_cantidad_final, trazabilidad_proceso
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35,$36,$37,$38::jsonb
      )
      ON CONFLICT (orden_trabajo_id) DO UPDATE SET
        adherencia=$2, lote_material=$3, lote_produccion=$4, tipo_impresion=$5,
        troquel=$6, codigo_troquel=$7, terminado_etiqueta=$8, terminados_especiales=$9,
        cantidad_por_rollo=$10, proveedor_material=$11, espesor=$12,
        material=$13, impresion=$14, observaciones=$15, numero_salida=$16,
        vendedor=$17, preprensa_responsable=$18, impresion_responsable=$19,
        laminado_responsable=$20, barnizado_responsable=$21,
        troquelado_flexible_responsable=$22, troquelado_plano_responsable=$23,
        rebobinado_responsable=$24, refilado_termoencogible_responsable=$25,
        sellado_termoencogible_responsable=$26, corte_termoencogible_responsable=$27,
        terminado_responsable=$28, liberacion_producto=$29, facturado=$30,
        vendedor_cantidad_final=$31, preprensa_cantidad_final=$32, prensa_cantidad_final=$33,
        laminado_barnizado_cantidad_final=$34, troquelado_cantidad_final=$35,
        terminados_cantidad_final=$36, liberacion_producto_cantidad_final=$37,
        trazabilidad_proceso=$38::jsonb, updated_at=CURRENT_TIMESTAMP`,
      [
        v.orden_trabajo_id,
        v.adherencia ?? null, v.lote_material ?? null, v.lote_produccion ?? null,
        v.tipo_impresion ?? null, v.troquel ?? null, v.codigo_troquel ?? null,
        v.terminado_etiqueta ?? null, v.terminados_especiales ?? null,
        v.cantidad_por_rollo ?? null, v.proveedor_material ?? null, v.espesor ?? null,
        v.material ?? null, v.impresion ?? null, v.observaciones ?? null, v.numero_salida ?? null,
        v.vendedor ?? null,
        v.preprensa_responsable ?? null,
        v.impresion_responsable ?? null,
        v.laminado_responsable ?? null,
        v.barnizado_responsable ?? null,
        v.troquelado_flexible_responsable ?? null,
        v.troquelado_plano_responsable ?? null,
        v.rebobinado_responsable ?? null,
        v.refilado_termoencogible_responsable ?? null,
        v.sellado_termoencogible_responsable ?? null,
        v.corte_termoencogible_responsable ?? null,
        v.terminado_responsable ?? null,
        v.liberacion_producto ?? null,
        v.facturado ?? null,
        v.vendedor_cantidad_final ?? null,
        v.preprensa_cantidad_final ?? null,
        v.prensa_cantidad_final ?? null,
        v.laminado_barnizado_cantidad_final ?? null,
        v.troquelado_cantidad_final ?? null,
        v.terminados_cantidad_final ?? null,
        v.liberacion_producto_cantidad_final ?? null,
        trazJson,
      ],
    );
  }

  // ─── PRODUCTOS ──────────────────────────────────────────────────────────────

  async deleteProductosByOrden(ordenTrabajoId: number): Promise<void> {
    await this.client.query(
      'DELETE FROM productos_orden_digital WHERE orden_trabajo_id = $1',
      [ordenTrabajoId],
    );
  }

  async createProductoFull(input: CreateProductoDigitalFullInput): Promise<void> {
    await this.client.query(
      `INSERT INTO productos_orden_digital (
        orden_trabajo_id, cantidad, cod_mg, cod_cliente, producto, avance,
        medida_ancho, medida_alto, cavidad, metros_impresos, orden,
        gap_horizontal, gap_vertical, tamano_papel_ancho, tamano_papel_largo, numero_salida
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        input.orden_trabajo_id,
        input.cantidad ?? null,
        input.cod_mg ?? null,
        input.cod_cliente ?? null,
        input.producto ?? null,
        input.avance ?? null,
        input.medida_ancho ?? null,
        input.medida_alto ?? null,
        input.cavidad ?? null,
        input.metros_impresos ?? null,
        input.orden,
        input.gap_horizontal ?? null,
        input.gap_vertical ?? null,
        input.tamano_papel_ancho ?? null,
        input.tamano_papel_largo ?? null,
        input.numero_salida ?? null,
      ],
    );
  }

  async listProductosByOrden(ordenTrabajoId: number): Promise<any[]> {
    const result = await this.client.query(
      'SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC',
      [ordenTrabajoId],
    );
    return result.rows;
  }
}
