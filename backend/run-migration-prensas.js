require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function runMigration() {
  try {
    await client.connect();
    console.log('🔄 Ejecutando migración: create-prensas-table.sql\n');

    const sqlPath = path.join(__dirname, 'migrations', 'create-prensas-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sqlContent);

    console.log('✅ Migración completada exitosamente!\n');

    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE activo = true) as activas
      FROM prensas
    `);

    console.log('📊 Estado actual:');
    console.log(`   • Total de prensas: ${result.rows[0].total}`);
    console.log(`   • Prensas activas: ${result.rows[0].activas}`);

    await client.end();
  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    process.exit(1);
  }
}

runMigration();
