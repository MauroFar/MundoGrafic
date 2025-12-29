const { Client } = require('pg');
require('dotenv').config();

async function verificarColumna() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sistema_mg',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'cotizaciones'
        AND column_name LIKE '%ejecutivo%'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Columnas encontradas:');
      result.rows.forEach(row => {
        console.log(`   ${row.column_name} (${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''})`);
      });
    } else {
      console.log('\n❌ No se encontró columna nombre_ejecutivo en la tabla cotizaciones');
      console.log('📝 Necesita crearse la columna');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verificarColumna();
