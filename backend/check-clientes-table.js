const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkTable() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clientes'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ La tabla "clientes" NO existe');
      return;
    }

    console.log('✅ La tabla "clientes" existe\n');

    // Obtener estructura de la tabla
    const structure = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY ordinal_position;
    `);

    console.log('📋 Estructura de la tabla clientes:');
    console.table(structure.rows);

    // Contar registros
    const count = await client.query('SELECT COUNT(*) FROM clientes');
    console.log(`\n📊 Total de registros: ${count.rows[0].count}`);

    // Mostrar algunos registros de ejemplo
    if (parseInt(count.rows[0].count) > 0) {
      const samples = await client.query('SELECT * FROM clientes LIMIT 3');
      console.log('\n📝 Ejemplos de registros:');
      console.table(samples.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTable();
