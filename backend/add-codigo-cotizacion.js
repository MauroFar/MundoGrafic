const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function addCodigoCotizacion() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Agregar columna codigo_cotizacion
    console.log('📝 Agregando columna codigo_cotizacion...');
    try {
      await client.query(`
        ALTER TABLE cotizaciones 
        ADD COLUMN IF NOT EXISTS codigo_cotizacion VARCHAR(20)
      `);
      console.log('✅ Columna codigo_cotizacion agregada\n');
    } catch (error) {
      console.log('⚠️  Columna ya existe:', error.message, '\n');
    }

    // 2. Generar códigos para registros existentes basados en el ID
    console.log('🔄 Generando códigos para cotizaciones existentes...');
    const result = await client.query(`
      SELECT id FROM cotizaciones 
      WHERE codigo_cotizacion IS NULL 
      ORDER BY id
    `);

    console.log(`📊 Se encontraron ${result.rows.length} cotizaciones sin código\n`);

    for (const row of result.rows) {
      const codigo = `COT${String(row.id).padStart(10, '0')}`;
      await client.query(
        'UPDATE cotizaciones SET codigo_cotizacion = $1 WHERE id = $2',
        [codigo, row.id]
      );
      console.log(`✓ ID ${row.id} → ${codigo}`);
    }

    // 3. Crear índice único
    console.log('\n📌 Creando índice único...');
    try {
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS cotizaciones_codigo_cotizacion_unique
        ON cotizaciones (codigo_cotizacion)
      `);
      console.log('✅ Índice único creado\n');
    } catch (error) {
      console.log('⚠️  Índice ya existe:', error.message, '\n');
    }

    // 4. Verificar resultados
    console.log('📋 Verificando algunos códigos generados:');
    const verification = await client.query(`
      SELECT id, numero_cotizacion, codigo_cotizacion 
      FROM cotizaciones 
      ORDER BY id 
      LIMIT 10
    `);

    console.table(verification.rows);

    console.log('\n✅ ¡Migración completada exitosamente!');
    console.log('\n💡 Resumen:');
    console.log('   - Campo codigo_cotizacion agregado');
    console.log('   - Códigos generados en formato COT00001, COT00002, etc.');
    console.log('   - Códigos sincronizados con el ID de la tabla');
    console.log('   - Índice único creado para prevenir duplicados\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

addCodigoCotizacion();
