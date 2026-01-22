const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mundografic'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos');
    
    const migrationSQL = require('fs').readFileSync(
      __dirname + '/migrations/add-tipo-orden-field.sql',
      'utf8'
    );
    
    console.log('🚀 Ejecutando migración: Agregar campo tipo_orden...\n');
    
    await client.query(migrationSQL);
    
    console.log('\n✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

runMigration();
