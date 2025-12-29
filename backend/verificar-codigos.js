const { Client } = require('pg');
require('dotenv').config();

async function verificarCodigos() {
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
      SELECT id, codigo_cotizacion, fecha 
      FROM cotizaciones 
      ORDER BY id
    `);
    
    console.log('\n📋 Cotizaciones actuales:');
    result.rows.forEach(row => {
      console.log(`   ID: ${row.id} → Código: ${row.codigo_cotizacion} (${row.fecha.toDateString()})`);
    });
    
    console.log(`\n📊 Total: ${result.rows.length} cotizaciones`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verificarCodigos();
