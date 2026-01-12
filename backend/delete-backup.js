require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function deleteBackup() {
  try {
    await client.connect();
    
    // Buscar tablas de backup
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename LIKE 'clientes_backup_%' 
      ORDER BY tablename DESC;
    `);

    if (result.rows.length > 0) {
      console.log(`📋 Tabla de backup encontrada: ${result.rows[0].tablename}`);
      
      await client.query(`DROP TABLE ${result.rows[0].tablename}`);
      
      console.log('✅ Tabla de backup eliminada exitosamente');
    } else {
      console.log('⚠️  No se encontró tabla de backup');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

deleteBackup();
