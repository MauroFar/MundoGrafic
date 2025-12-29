const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function addCreatedAt() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    console.log('\n🔧 Agregando created_at a cotizaciones...\n');

    // Agregar created_at
    try {
      console.log('Agregando created_at...');
      await client.query(`
        ALTER TABLE cotizaciones 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ created_at agregado\n');
    } catch (error) {
      console.log('⚠️  created_at ya existe o hubo un error:', error.message, '\n');
    }

    // Actualizar registros existentes que no tengan created_at
    try {
      console.log('Actualizando registros sin created_at usando la fecha...');
      await client.query(`
        UPDATE cotizaciones 
        SET created_at = fecha 
        WHERE created_at IS NULL
      `);
      console.log('✅ Registros actualizados\n');
    } catch (error) {
      console.log('⚠️  Error actualizando registros:', error.message, '\n');
    }

    console.log('✅ ¡Completado!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

addCreatedAt();
