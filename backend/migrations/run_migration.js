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

    // Permite pasar el nombre del archivo SQL por argumento.
    // Ejemplo: node migrations/run_migration.js 016_responsables_digital_nuevos_campos.sql
    const migrationFile = process.argv[2] || '016_responsables_digital_nuevos_campos.sql';
    const sqlPath = path.join(__dirname, migrationFile);
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No existe el archivo de migracion: ${migrationFile}`);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📝 Ejecutando migración: ${migrationFile}`);
    await client.query(sql);
    console.log('✅ Migración ejecutada exitosamente');

    // Verificar columnas esperadas en detalle_orden_trabajo_digital
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'detalle_orden_trabajo_digital'
      AND column_name IN (
        'preprensa_responsable',
        'impresion_responsable',
        'laminado_responsable',
        'barnizado_responsable',
        'troquelado_flexible_responsable',
        'troquelado_plano_responsable',
        'rebobinado_responsable',
        'refilado_termoencogible_responsable',
        'sellado_termoencogible_responsable',
        'corte_termoencogible_responsable',
        'terminado_responsable'
      )
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Columnas verificadas:');
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
