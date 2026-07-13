import { Client } from 'pg';
import { DetalleOrdenOffsetData, CreateDetalleOffsetInput } from '../../domain/entities/types';

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
  tamano?: string | null;
  tamano_abierto_1?: string | null;
  tamano_cerrado_1?: string | null;
  instrucciones_impresion?: string | null;
  instrucciones_acabados?: string | null;
  instrucciones_empacado?: string | null;
  material?: string | null;
  impresion?: string | null;
  observaciones?: string | null;
  numero_salida?: string | null;
  trazabilidad_proceso?: any;
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
        orden_trabajo_id, material, impresion, observaciones, corte_material,
        cantidad_pliegos_compra, exceso, pliegos_impresos, tintas_frente, tintas_reverso,
        barniz, terminados, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *`,
      [
        input.orden_trabajo_id,
        input.material || null,
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

    await this.client.query(
      `INSERT INTO detalle_orden_trabajo_offset (
        orden_trabajo_id, corte_material, cantidad_pliegos_compra, exceso, total_pliegos,
        tamano, tamano_abierto_1, tamano_cerrado_1, instrucciones_impresion,
        instrucciones_acabados, instrucciones_empacado, material, impresion, observaciones,
        numero_salida, vendedor, preprensa, prensa, terminados, facturado,
        vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final,
        terminados_cantidad_final, trazabilidad_proceso
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb
      )
      ON CONFLICT (orden_trabajo_id) DO UPDATE SET
        corte_material=$2, cantidad_pliegos_compra=$3, exceso=$4, total_pliegos=$5,
        tamano=$6, tamano_abierto_1=$7, tamano_cerrado_1=$8,
        instrucciones_impresion=$9, instrucciones_acabados=$10, instrucciones_empacado=$11,
        material=$12, impresion=$13, observaciones=$14, numero_salida=$15,
        vendedor=$16, preprensa=$17, prensa=$18, terminados=$19, facturado=$20,
        vendedor_cantidad_final=$21, preprensa_cantidad_final=$22,
        prensa_cantidad_final=$23, terminados_cantidad_final=$24,
        trazabilidad_proceso=$25::jsonb, updated_at=CURRENT_TIMESTAMP`,
      [
        v.orden_trabajo_id,
        v.corte_material ?? null,
        v.cantidad_pliegos_compra ?? null,
        v.exceso ?? null,
        v.total_pliegos ?? null,
        v.tamano ?? null,
        v.tamano_abierto_1 ?? null,
        v.tamano_cerrado_1 ?? null,
        v.instrucciones_impresion ?? null,
        v.instrucciones_acabados ?? null,
        v.instrucciones_empacado ?? null,
        v.material ?? null,
        v.impresion ?? null,
        v.observaciones ?? null,
        v.numero_salida ?? null,
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
