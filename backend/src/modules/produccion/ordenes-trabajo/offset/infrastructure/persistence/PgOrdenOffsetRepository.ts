import { Client } from 'pg';
import { DetalleOrdenOffsetData, CreateDetalleOffsetInput, MaterialAdicionalOffsetData } from '../../domain/entities/types';

/**
 * Tipos extendidos para el upsert completo desde los use-cases
 */
export interface UpsertDetalleOffsetInput {
  orden_trabajo_id: number;
  // Campos de detalle técnico
  corte_material?: string | null;
  cantidad_pliegos_compra?: string | null;
  exceso?: string | null;
  total_pliegos?: string | null;
  // Material
  tamano_pliego?: string | null;
  cabida_producto?: string | null;
  // Guillotina
  guillotina_tamano_corte?: string | null;
  guillotina_cabida_corte?: string | null;
  // Prensas
  prensas_pliegos_imprimir?: string | null;
  prensas_cabida_impresion?: string | null;
  prensas_total_impresion?: string | null;
  tamano?: string | null;
  tamano_abierto_1?: string | null;
  tamano_cerrado_1?: string | null;
  instrucciones_impresion?: string | null;
  instrucciones_acabados?: string | null;
  instrucciones_empacado?: string | null;
  material?: string | null;
  codigo_producto?: string | null;
  impresion?: string | null;
  observaciones?: string | null;
  numero_salida?: string | null;
  prensa_seleccionada?: string | null;
  trazabilidad_proceso?: any;
  estilo_secciones_offset?: Record<string, { color: string; bold: boolean; underline: boolean }> | null;
  materiales_adicionales?: MaterialAdicionalOffsetData[] | null;
  // Responsables
  vendedor?: string | null;
  preprensa?: string | null;
  prensa?: string | null;
  terminados?: string | null;
  facturado?: string | null;
  // Cantidades finales
  vendedor_cantidad_final?: string | null;
  preprensa_cantidad_final?: string | null;
  prensa_cantidad_final?: string | null;
  terminados_cantidad_final?: string | null;
}

export interface CreateProductoOffsetFullInput {
  orden_trabajo_id: number;
  orden: number;
  concepto?: string | null;
  cantidad?: number | null;
  tamano_abierto?: string | null;
  tamano_cerrado?: string | null;
  material?: string | null;
}

export class PgOrdenOffsetRepository {
  constructor(private readonly client: Client) {}

  // ─── DETALLE SIMPLE (usado por use-cases de lectura/creación unitaria) ─────

  async createDetalle(input: CreateDetalleOffsetInput): Promise<DetalleOrdenOffsetData> {
    const result = await this.client.query(
      `INSERT INTO detalle_orden_trabajo_offset (
        orden_trabajo_id, material, codigo_producto, impresion, observaciones, corte_material,
        cantidad_pliegos_compra, exceso, pliegos_impresos, tintas_frente, tintas_reverso,
        barniz, terminados, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) RETURNING *`,
      [
        input.orden_trabajo_id,
        input.material || null,
        input.codigo_producto || null,
        input.impresion || null,
        input.observaciones || null,
        input.corte_material || null,
        input.cantidad_pliegos_compra || null,
        input.exceso || null,
        input.pliegos_impresos || null,
        input.tintas_frente || null,
        input.tintas_reverso || null,
        input.barniz || null,
        input.terminados || null,
      ],
    );
    return result.rows[0];
  }

  async findDetalleByOrdenId(ordenTrabajoId: number): Promise<DetalleOrdenOffsetData | null> {
    const result = await this.client.query(
      'SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1',
      [ordenTrabajoId],
    );
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  // ─── UPSERT COMPLETO (usado por CreateOrdenCompletaUseCase y UpdateOrdenCompletaUseCase) ─

  async upsertDetalleCompleto(input: UpsertDetalleOffsetInput): Promise<void> {
    const v = input;
    const trazJson = v.trazabilidad_proceso ? JSON.stringify(v.trazabilidad_proceso) : null;
    const estilosJson = v.estilo_secciones_offset ? JSON.stringify(v.estilo_secciones_offset) : null;
    const materialesAdicionalesJson = v.materiales_adicionales ? JSON.stringify(v.materiales_adicionales) : null;

    await this.client.query(
      `INSERT INTO detalle_orden_trabajo_offset (
        orden_trabajo_id, corte_material, cantidad_pliegos_compra, exceso, total_pliegos,
        tamano_pliego, cabida_producto, guillotina_tamano_corte, guillotina_cabida_corte,
        prensas_pliegos_imprimir, prensas_cabida_impresion, prensas_total_impresion,
        tamano, tamano_abierto_1, tamano_cerrado_1, instrucciones_impresion,
        instrucciones_acabados, instrucciones_empacado, material, codigo_producto, impresion, observaciones,
        numero_salida, prensa_seleccionada, vendedor, preprensa, prensa, terminados, facturado,
        vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final,
        terminados_cantidad_final, trazabilidad_proceso, estilo_secciones_offset, materiales_adicionales
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36
      )
      ON CONFLICT (orden_trabajo_id) DO UPDATE SET
        corte_material=$2, cantidad_pliegos_compra=$3, exceso=$4, total_pliegos=$5,
        tamano_pliego=$6, cabida_producto=$7, guillotina_tamano_corte=$8,
        guillotina_cabida_corte=$9, prensas_pliegos_imprimir=$10,
        prensas_cabida_impresion=$11, prensas_total_impresion=$12,
        tamano=$13, tamano_abierto_1=$14, tamano_cerrado_1=$15,
        instrucciones_impresion=$16, instrucciones_acabados=$17, instrucciones_empacado=$18,
        material=$19, codigo_producto=$20, impresion=$21, observaciones=$22, numero_salida=$23,
        prensa_seleccionada=$24, vendedor=$25, preprensa=$26, prensa=$27, terminados=$28,
        facturado=$29, vendedor_cantidad_final=$30, preprensa_cantidad_final=$31,
        prensa_cantidad_final=$32, terminados_cantidad_final=$33,
        trazabilidad_proceso=$34::jsonb, estilo_secciones_offset=$35::jsonb,
        materiales_adicionales=$36::jsonb, updated_at=CURRENT_TIMESTAMP`,
      [
        v.orden_trabajo_id,
        v.corte_material ?? null,
        v.cantidad_pliegos_compra ?? null,
        v.exceso ?? null,
        v.total_pliegos ?? null,
        v.tamano_pliego ?? null,
        v.cabida_producto ?? null,
        v.guillotina_tamano_corte ?? null,
        v.guillotina_cabida_corte ?? null,
        v.prensas_pliegos_imprimir ?? null,
        v.prensas_cabida_impresion ?? null,
        v.prensas_total_impresion ?? null,
        v.tamano ?? null,
        v.tamano_abierto_1 ?? null,
        v.tamano_cerrado_1 ?? null,
        v.instrucciones_impresion ?? null,
        v.instrucciones_acabados ?? null,
        v.instrucciones_empacado ?? null,
        v.material ?? null,
        v.codigo_producto ?? null,
        v.impresion ?? null,
        v.observaciones ?? null,
        v.numero_salida ?? null,
        v.prensa_seleccionada ?? null,
        v.vendedor ?? null,
        v.preprensa ?? null,
        v.prensa ?? null,
        v.terminados ?? null,
        v.facturado ?? null,
        v.vendedor_cantidad_final ?? null,
        v.preprensa_cantidad_final ?? null,
        v.prensa_cantidad_final ?? null,
        v.terminados_cantidad_final ?? null,
        trazJson,
        estilosJson,
        materialesAdicionalesJson,
      ],
    );
  }

  // ─── PRODUCTOS ──────────────────────────────────────────────────────────────

  async deleteProductosByOrden(ordenTrabajoId: number): Promise<void> {
    await this.client.query(
      'DELETE FROM productos_orden_offset WHERE orden_trabajo_id = $1',
      [ordenTrabajoId],
    );
  }

  async createProductoFull(input: CreateProductoOffsetFullInput): Promise<void> {
    await this.client.query(
      `INSERT INTO productos_orden_offset (
        orden_trabajo_id, concepto, cantidad, tamano_abierto, tamano_cerrado, material, orden
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        input.orden_trabajo_id,
        input.concepto ?? null,
        input.cantidad ?? null,
        input.tamano_abierto ?? null,
        input.tamano_cerrado ?? null,
        input.material ?? null,
        input.orden,
      ],
    );
  }

  async listProductosByOrden(ordenTrabajoId: number): Promise<any[]> {
    const result = await this.client.query(
      'SELECT * FROM productos_orden_offset WHERE orden_trabajo_id = $1 ORDER BY orden ASC',
      [ordenTrabajoId],
    );
    return result.rows;
  }
}
