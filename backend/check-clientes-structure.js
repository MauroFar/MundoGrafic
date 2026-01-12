require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function checkClientesStructure() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Obtener estructura de la tabla clientes
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length, 
        is_nullable, 
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY ordinal_position;
    `);

    console.log('=== ESTRUCTURA DE LA TABLA CLIENTES ===\n');
    console.log('Total de columnas:', result.rows.length);
    console.log('\n');

    result.rows.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(25)} | Nullable: ${col.is_nullable.padEnd(3)} | Max: ${(col.character_maximum_length || 'N/A').toString().padEnd(6)}`);
    });

    // Buscar campos duplicados por nombre
    console.log('\n\n=== VERIFICACIÓN DE CAMPOS DUPLICADOS ===\n');
    const columnNames = result.rows.map(r => r.column_name.toLowerCase());
    const duplicates = columnNames.filter((item, index) => columnNames.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('⚠️  CAMPOS DUPLICADOS ENCONTRADOS:');
      duplicates.forEach(dup => console.log(`   - ${dup}`));
    } else {
      console.log('✅ No se encontraron campos duplicados exactos');
    }

    // Buscar campos similares (telefono, telefono_cliente, etc.)
    console.log('\n=== CAMPOS RELACIONADOS CON TELÉFONO ===\n');
    const telefonoFields = result.rows.filter(r => r.column_name.toLowerCase().includes('telefono') || r.column_name.toLowerCase().includes('celular'));
    
    if (telefonoFields.length > 0) {
      telefonoFields.forEach(field => {
        console.log(`   - ${field.column_name} (${field.data_type})`);
      });
    } else {
      console.log('No se encontraron campos relacionados con teléfono');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkClientesStructure();
