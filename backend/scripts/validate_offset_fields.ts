/**
 * Script de validación: Verificar que todos los campos de OFFSET
 * se estén guardando correctamente en la BD
 *
 * USO: npm run validate-offset-fields
 * 
 * Este script verifica:
 * 1. Estructura de la tabla detalle_orden_trabajo_offset en BD
 * 2. Campos que el código intenta insertar vs campos de la tabla
 * 3. Órdenes offset existentes y qué campos tienen NULL
 * 4. Genera un reporte detallado con inconsistencias
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Campos que el código INTENTA INSERTAR en detalle_orden_trabajo_offset
const CAMPOS_CODIGO = [
  'id', // PK, auto
  'orden_trabajo_id',
  'corte_material',
  'cantidad_pliegos_compra',
  'exceso',
  'total_pliegos',
  'tamano',
  'tamano_abierto_1',
  'tamano_cerrado_1',
  'instrucciones_impresion',
  'instrucciones_acabados',
  'instrucciones_empacado',
  'prensa_seleccionada',
  'material',
  'impresion',
  'observaciones',
  'numero_salida',
  'vendedor',
  'preprensa',
  'prensa',
  'terminados',
  'facturado',
  'vendedor_cantidad_final',
  'preprensa_cantidad_final',
  'prensa_cantidad_final',
  'terminados_cantidad_final',
  'trazabilidad_proceso',
  'created_at', // timestamp
  'updated_at', // timestamp
];

// Campos EXTRAS en BD que NO están en el código (pero deberían estarlo?)
const CAMPOS_EXTRAS_BD = [
  'tipo_papel_proveedor',
  'tipo_papel_prensa',
  'tipo_papel_velocidad',
  'tipo_papel_calibre',
  'tipo_papel_referencia',
  'tipo_papel_gramos',
  'tipo_papel_tamano',
  'tipo_papel_cant_colores',
  'tipo_papel_cant_pliegos',
  'tipo_papel_exceso',
  'guillotina_pliegos_cortar',
  'guillotina_tamano_corte',
  'guillotina_cabida_corte',
  'prensas_pliegos_imprimir',
  'prensas_cabida_impresion',
  'prensas_total_impresion',
];

async function main() {
  try {
    console.log('\n🔍 === VALIDACIÓN DE CAMPOS OFFSET ===\n');

    // ============================================================
    // 1. Obtener estructura de la tabla en BD
    // ============================================================
    console.log('1️⃣  Obteniendo estructura de detalle_orden_trabajo_offset...');
    const columnasResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'detalle_orden_trabajo_offset'
      ORDER BY ordinal_position ASC
    `);

    const columnasBD = columnasResult.rows.map((r: any) => r.column_name);
    console.log(`   ✅ Tabla tiene ${columnasResult.rows.length} columnas\n`);

    // ============================================================
    // 2. Comparar campos del código vs campos en BD
    // ============================================================
    console.log('2️⃣  Comparando campos código vs BD...\n');
    
    const camposEnBD = new Set(columnasBD);
    const camposCodigo = new Set(CAMPOS_CODIGO);

    const camposFaltantes = CAMPOS_CODIGO.filter(c => !camposEnBD.has(c));
    const camposExtrasBD = columnasBD.filter(c => !camposCodigo.has(c));

    if (camposFaltantes.length > 0) {
      console.log('❌ CAMPOS EN CÓDIGO PERO NO EN BD:');
      camposFaltantes.forEach(c => console.log(`   - ${c}`));
      console.log();
    } else {
      console.log('✅ Todos los campos del código existen en la BD\n');
    }

    if (camposExtrasBD.length > 0) {
      console.log('⚠️  CAMPOS EN BD PERO NO EN CÓDIGO (extras):');
      camposExtrasBD.forEach(c => console.log(`   - ${c}`));
      console.log();
    }

    // ============================================================
    // 3. Detalle de cada columna en BD
    // ============================================================
    console.log('3️⃣  Detalle de columnas en BD:\n');
    console.log('Columna'.padEnd(35) + 'Tipo'.padEnd(20) + 'Nullable');
    console.log('-'.repeat(75));
    columnasResult.rows.forEach((r: any) => {
      console.log(
        r.column_name.padEnd(35) +
        r.data_type.padEnd(20) +
        (r.is_nullable === 'YES' ? 'SÍ' : 'NO')
      );
    });

    // ============================================================
    // 4. Verificar órdenes OFFSET que existen y analizar datos
    // ============================================================
    console.log('\n4️⃣  Analizando órdenes OFFSET existentes...\n');

    const offsetsResult = await pool.query(`
      SELECT COUNT(*) as total FROM detalle_orden_trabajo_offset
    `);
    const totalOffsets = offsetsResult.rows[0].total;
    console.log(`   Total de órdenes OFFSET en BD: ${totalOffsets}\n`);

    if (totalOffsets === 0) {
      console.log('   ⚠️  No hay órdenes OFFSET en la BD. Crea una para validar.');
    } else {
      // Obtener primeras 5 órdenes OFFSET con detalle de campos NULL
      const ordenesResult = await pool.query(`
        SELECT 
          dto.id,
          ot.numero_orden,
          ot.nombre_cliente,
          dto.corte_material,
          dto.cantidad_pliegos_compra,
          dto.exceso,
          dto.total_pliegos,
          dto.tamano,
          dto.tamano_abierto_1,
          dto.tamano_cerrado_1,
          dto.instrucciones_impresion,
          dto.instrucciones_acabados,
          dto.instrucciones_empacado,
          dto.material,
          dto.impresion,
          dto.observaciones,
          dto.numero_salida,
          dto.vendedor,
          dto.preprensa,
          dto.prensa,
          dto.terminados,
          dto.facturado,
          dto.vendedor_cantidad_final,
          dto.preprensa_cantidad_final,
          dto.prensa_cantidad_final,
          dto.terminados_cantidad_final,
          dto.trazabilidad_proceso,
          dto.tipo_papel_proveedor,
          dto.tipo_papel_prensa,
          dto.tipo_papel_velocidad,
          dto.tipo_papel_calibre,
          dto.tipo_papel_referencia,
          dto.tipo_papel_gramos,
          dto.tipo_papel_tamano,
          dto.tipo_papel_cant_colores,
          dto.tipo_papel_cant_pliegos,
          dto.tipo_papel_exceso,
          dto.guillotina_pliegos_cortar,
          dto.guillotina_tamano_corte,
          dto.guillotina_cabida_corte,
          dto.prensas_pliegos_imprimir,
          dto.prensas_cabida_impresion,
          dto.prensas_total_impresion,
          dto.created_at,
          dto.updated_at
        FROM detalle_orden_trabajo_offset dto
        JOIN orden_trabajo ot ON ot.id = dto.orden_trabajo_id
        ORDER BY dto.created_at DESC
        LIMIT 5
      `);

      console.log(`   Analizando primeras ${ordenesResult.rows.length} órdenes OFFSET:\n`);

      for (const orden of ordenesResult.rows) {
        console.log(`   📋 Orden: ${orden.numero_orden} (Cliente: ${orden.nombre_cliente})`);
        console.log(`      ID detalle: ${orden.id}`);
        
        // Contar campos NULL (excluyendo campos que pueden ser NULL legítimamente)
        const camposConValor = CAMPOS_CODIGO.filter(campo => {
          return orden[campo] !== null && orden[campo] !== undefined;
        }).length;

        const camposNull = CAMPOS_CODIGO.filter(campo => {
          return orden[campo] === null || orden[campo] === undefined;
        });

        console.log(`      Campos con valor: ${camposConValor}/${CAMPOS_CODIGO.length}`);
        
        if (camposNull.length > 0) {
          const camposNullCriticos = camposNull.filter(c => 
            // Excluir campos que pueden ser NULL legítimamente
            !['facturado', 'prensa_seleccionada', 'observaciones', 'trazabilidad_proceso'].includes(c)
          );
          
          if (camposNullCriticos.length > 0) {
            console.log(`      ⚠️  Campos esperados pero NULL:`);
            camposNullCriticos.forEach(c => console.log(`         - ${c}`));
          }
        }
        console.log();
      }
    }

    // ============================================================
    // 5. Validar integridad referencial
    // ============================================================
    console.log('5️⃣  Validando integridad referencial...\n');

    const refResult = await pool.query(`
      SELECT COUNT(*) as count_orfanos
      FROM detalle_orden_trabajo_offset dto
      WHERE NOT EXISTS (SELECT 1 FROM orden_trabajo ot WHERE ot.id = dto.orden_trabajo_id)
    `);

    const orfanos = refResult.rows[0].count_orfanos;
    if (orfanos > 0) {
      console.log(`   ❌ Se encontraron ${orfanos} registros OFFSET huérfanos (sin orden_trabajo)`);
    } else {
      console.log(`   ✅ Integridad referencial OK (todos los OFFSET tienen su orden_trabajo)`);
    }

    // ============================================================
    // 7. ANÁLISIS DE CAMPOS EXTRAS EN BD
    // ============================================================
    console.log('7️⃣  Campos extras en BD (no usados en código)...\n');

    console.log('Estos 16 campos existen en la BD pero NO se rellenan desde el código:');
    CAMPOS_EXTRAS_BD.forEach(c => console.log(`   - ${c}`));

    console.log('\n⚠️  POSIBLES ACCIONES:');
    console.log('   a) Si estos campos son necesarios: Agregar lógica en ordenTrabajo.ts para rellenarlos');
    console.log('   b) Si NO son necesarios: Crear migración para eliminarlos de la BD');

    // ============================================================
    // 8. VERIFICAR SI LOS CAMPOS EXTRAS TIENEN DATOS
    // ============================================================
    console.log('\n8️⃣  Verificando si campos extras tienen datos...\n');

    const dataExtraResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE tipo_papel_proveedor IS NOT NULL) as tp_proveedor,
        COUNT(*) FILTER (WHERE tipo_papel_prensa IS NOT NULL) as tp_prensa,
        COUNT(*) FILTER (WHERE tipo_papel_velocidad IS NOT NULL) as tp_velocidad,
        COUNT(*) FILTER (WHERE tipo_papel_calibre IS NOT NULL) as tp_calibre,
        COUNT(*) FILTER (WHERE tipo_papel_referencia IS NOT NULL) as tp_referencia,
        COUNT(*) FILTER (WHERE tipo_papel_gramos IS NOT NULL) as tp_gramos,
        COUNT(*) FILTER (WHERE tipo_papel_tamano IS NOT NULL) as tp_tamano,
        COUNT(*) FILTER (WHERE tipo_papel_cant_colores IS NOT NULL) as tp_cant_colores,
        COUNT(*) FILTER (WHERE tipo_papel_cant_pliegos IS NOT NULL) as tp_cant_pliegos,
        COUNT(*) FILTER (WHERE tipo_papel_exceso IS NOT NULL) as tp_exceso,
        COUNT(*) FILTER (WHERE guillotina_pliegos_cortar IS NOT NULL) as g_pliegos,
        COUNT(*) FILTER (WHERE guillotina_tamano_corte IS NOT NULL) as g_tamano,
        COUNT(*) FILTER (WHERE guillotina_cabida_corte IS NOT NULL) as g_cabida,
        COUNT(*) FILTER (WHERE prensas_pliegos_imprimir IS NOT NULL) as p_pliegos,
        COUNT(*) FILTER (WHERE prensas_cabida_impresion IS NOT NULL) as p_cabida,
        COUNT(*) FILTER (WHERE prensas_total_impresion IS NOT NULL) as p_total
      FROM detalle_orden_trabajo_offset
    `);

    const dataExtra = dataExtraResult.rows[0];
    const camposExtraConDatos = Object.entries(dataExtra)
      .filter(([_, count]) => count > 0)
      .map(([field]) => field);

    if (camposExtraConDatos.length === 0) {
      console.log('   ✅ Ninguno de los campos extras tiene datos (están todos vacíos)');
      console.log('   ✅ Es seguro ignorarlos por ahora');
    } else {
      console.log(`   ⚠️  ${camposExtraConDatos.length} campos extras TIENEN datos guardados:`);
      camposExtraConDatos.forEach(c => console.log(`      - ${c}: ${dataExtra[c]} registros`));
      console.log('\n   📌 IMPORTANTE: Estos campos YA TIENEN DATOS, por lo que:');
      console.log('      - Si son importantes: Incluirlos en los INSERTs/UPDATEs del código');
      console.log('      - Si no son importantes: Hacer migración para limpiar datos y luego eliminar columnas');
    }

    console.log('\n6️⃣  Verificando productos OFFSET asociados...\n');

    const productosResult = await pool.query(`
      SELECT 
        poo.orden_trabajo_id,
        COUNT(*) as cantidad_productos,
        MIN(poo.concepto) as primer_concepto
      FROM productos_orden_offset poo
      GROUP BY poo.orden_trabajo_id
      ORDER BY poo.orden_trabajo_id DESC
      LIMIT 5
    `);

    if (productosResult.rows.length === 0) {
      console.log('   ⚠️  No hay productos OFFSET registrados en la BD');
    } else {
      console.log(`   Muestreo de ${productosResult.rows.length} órdenes con productos:\n`);
      for (const p of productosResult.rows) {
        console.log(`   Orden ID ${p.orden_trabajo_id}: ${p.cantidad_productos} producto(s) - Concepto: ${p.primer_concepto || '(sin concepto)'}`);
      }
    }

    // ============================================================
    // REPORTE FINAL
    // ============================================================
    console.log('\n' + '='.repeat(75));
    console.log('📊 REPORTE FINAL DE VALIDACIÓN\n');

    if (camposFaltantes.length === 0 && orfanos === 0 && totalOffsets > 0) {
      console.log('✅ ESTADO: ÓPTIMO');
      console.log('   - Todos los campos existen en la BD');
      console.log('   - No hay registros huérfanos');
      console.log('   - Existen órdenes OFFSET para validar');
    } else if (camposFaltantes.length > 0) {
      console.log('❌ ESTADO: CRÍTICO');
      console.log(`   - ${camposFaltantes.length} campos del código NO existen en BD`);
      console.log('   - Los INSERT fallarán al intentar guardar estos campos');
      console.log('\n   RECOMENDACIÓN: Ejecutar migraciones 001 y 002 nuevamente');
    } else {
      console.log('⚠️  ESTADO: REQUIERE REVISIÓN');
      if (orfanos > 0) console.log(`   - Hay ${orfanos} registros huérfanos en BD`);
      if (totalOffsets === 0) console.log('   - No hay datos de prueba para validar');
    }

    console.log('\n' + '='.repeat(75) + '\n');

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
