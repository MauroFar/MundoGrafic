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

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const migrationPath = path.join(__dirname, 'migrations', 'add-cantidad-final-responsables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Ejecutando migración: add-cantidad-final-responsables.sql');
    
    // Ejecutar la migración
    await client.query(sql);
    
    console.log('✅ Migración ejecutada correctamente');
    console.log('📊 Se agregaron 7 campos de cantidad final para responsables');

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

runMigration();
