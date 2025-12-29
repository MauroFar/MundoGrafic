const { Client } = require('pg');
require('dotenv').config();

async function eliminarNumeroCotizacion() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sistema_mg',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // 1. Eliminar la secuencia
    console.log('🔄 Eliminando secuencia cotizaciones_numero_cotizacion_seq...');
    try {
      await client.query('DROP SEQUENCE IF EXISTS cotizaciones_numero_cotizacion_seq CASCADE');
      console.log('✅ Secuencia eliminada');
    } catch (error) {
      console.log('⚠️ Secuencia no existía o ya fue eliminada');
    }

    // 2. Eliminar la columna numero_cotizacion
    console.log('🔄 Eliminando columna numero_cotizacion...');
    try {
      await client.query('ALTER TABLE cotizaciones DROP COLUMN IF EXISTS numero_cotizacion');
      console.log('✅ Columna numero_cotizacion eliminada');
    } catch (error) {
      console.error('❌ Error al eliminar columna:', error.message);
    }

    // 3. Verificar que todas las cotizaciones tienen código
    console.log('🔄 Verificando códigos de cotización...');
    const sinCodigo = await client.query(`
      SELECT id FROM cotizaciones WHERE codigo_cotizacion IS NULL
    `);
    
    if (sinCodigo.rows.length > 0) {
      console.log(`⚠️ Encontradas ${sinCodigo.rows.length} cotizaciones sin código, asignando...`);
      for (const row of sinCodigo.rows) {
        const codigo = `CO${String(row.id).padStart(5, '0')}`;
        await client.query(
          'UPDATE cotizaciones SET codigo_cotizacion = $1 WHERE id = $2',
          [codigo, row.id]
        );
      }
      console.log('✅ Códigos asignados');
    }

    // 4. Mostrar resumen
    const resumen = await client.query(`
      SELECT id, codigo_cotizacion, fecha 
      FROM cotizaciones 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Últimas 5 cotizaciones:');
    resumen.rows.forEach(row => {
      console.log(`   ID: ${row.id} → Código: ${row.codigo_cotizacion} (${row.fecha})`);
    });
    
    console.log('\n✅ Migración completada exitosamente');
    console.log('📌 Ahora solo se usará codigo_cotizacion (formato: CO00001)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

eliminarNumeroCotizacion();
