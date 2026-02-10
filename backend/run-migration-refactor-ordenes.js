const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Paso 1: Crear tablas nuevas
    console.log('\n📊 Paso 1: Creando tablas separadas...');
    const sqlCrear = fs.readFileSync(
      path.join(__dirname, 'migrations', 'crear-tablas-orden-separadas.sql'),
      'utf8'
    );
    await client.query(sqlCrear);
    console.log('✅ Tablas creadas exitosamente');

    // Paso 2: Migrar datos existentes
    console.log('\n🔄 Paso 2: Migrando datos existentes...');
    const sqlMigrar = fs.readFileSync(
      path.join(__dirname, 'migrations', 'migrar-datos-ordenes.sql'),
      'utf8'
    );
    await client.query(sqlMigrar);
    console.log('✅ Datos migrados exitosamente');

    // Paso 3: Verificar migración
    console.log('\n🔍 Paso 3: Verificando migración...');
    
    const resultOffset = await client.query('SELECT COUNT(*) FROM detalle_orden_trabajo_offset');
    const resultDigital = await client.query('SELECT COUNT(*) FROM detalle_orden_trabajo_digital');
    const resultProductos = await client.query('SELECT COUNT(*) FROM productos_orden_digital');
    
    console.log(`   ✓ Detalles OFFSET: ${resultOffset.rows[0].count} registros`);
    console.log(`   ✓ Detalles DIGITAL: ${resultDigital.rows[0].count} registros`);
    console.log(`   ✓ Productos DIGITAL: ${resultProductos.rows[0].count} registros`);

    // Paso 4: ADVERTENCIA sobre limpieza
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   La migración de estructura está completa.');
    console.log('   Para limpiar campos redundantes de detalle_orden_trabajo, ejecuta:');
    console.log('   node run-migration-limpiar-detalle.js');
    console.log('\n   ⚠️  Solo ejecuta la limpieza después de verificar que todo funciona correctamente.');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en la migración:', error.message);
    process.exit(1);
  });
