// Script para ejecutar la migración de base de datos
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    // Leer el archivo SQL (actualmente: campos extra para orden digital)
    const sqlPath = path.join(__dirname, 'add_digital_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando migración...');
    await client.query(sql);
    console.log('✅ Migración ejecutada exitosamente');

    // Verificar las columnas creadas
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'detalle_cotizacion'
      AND column_name IN ('posicion_imagen', 'texto_negrita')
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Columnas creadas:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

runMigration();
