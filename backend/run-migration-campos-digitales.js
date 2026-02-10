require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function ejecutarMigracion() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'agregar-campos-digitales.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando migración: Agregar campos de información técnica digital...');
    
    // Ejecutar la migración
    await client.query(sql);
    
    console.log('✅ Migración completada exitosamente');
    console.log('✅ Campos agregados a detalle_orden_trabajo:');
    console.log('   - adherencia');
    console.log('   - lote_material');
    console.log('   - lote_produccion');
    console.log('   - tipo_impresion');
    console.log('   - troquel');
    console.log('   - codigo_troquel');
    console.log('   - terminado_etiqueta');
    console.log('   - terminados_especiales');
    console.log('   - cantidad_por_rollo');
    console.log('   - productos_digital');

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Desconectado de la base de datos');
  }
}

ejecutarMigracion();
