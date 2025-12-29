const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function renameColumn() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('🔧 Renombrando columna nit_cliente a ruc_cedula_cliente...\n');

    // Renombrar la columna
    await client.query(`
      ALTER TABLE clientes 
      RENAME COLUMN nit_cliente TO ruc_cedula_cliente;
    `);

    console.log('✅ Columna renombrada exitosamente!');
    console.log('   nit_cliente → ruc_cedula_cliente\n');

    // Verificar el cambio
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY ordinal_position;
    `);

    console.log('📋 Columnas actuales en la tabla clientes:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

renameColumn();
