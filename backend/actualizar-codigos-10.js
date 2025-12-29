const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function actualizarCodigos() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('🔄 Actualizando códigos a 10 dígitos...\n');
    
    const result = await client.query(`
      SELECT id, codigo_cotizacion FROM cotizaciones 
      ORDER BY id
    `);

    for (const row of result.rows) {
      const nuevoCodigo = `COT${String(row.id).padStart(10, '0')}`;
      await client.query(
        'UPDATE cotizaciones SET codigo_cotizacion = $1 WHERE id = $2',
        [nuevoCodigo, row.id]
      );
      console.log(`✓ ID ${row.id}: ${row.codigo_cotizacion} → ${nuevoCodigo}`);
    }

    console.log('\n📋 Verificando códigos actualizados:');
    const verification = await client.query(`
      SELECT id, numero_cotizacion, codigo_cotizacion 
      FROM cotizaciones 
      ORDER BY id
    `);

    console.table(verification.rows);

    console.log('\n✅ ¡Códigos actualizados exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

actualizarCodigos();
