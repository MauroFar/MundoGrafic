const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function addAuditFields() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('🔧 Agregando campos de auditoría...\n');

    // 1. Agregar created_by
    console.log('1️⃣ Agregando created_by...');
    await client.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES usuarios(id)
    `);
    console.log('✅ Campo created_by agregado\n');

    // 2. Agregar updated_by
    console.log('2️⃣ Agregando updated_by...');
    await client.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES usuarios(id)
    `);
    console.log('✅ Campo updated_by agregado\n');

    // 3. Agregar updated_at
    console.log('3️⃣ Agregando updated_at...');
    await client.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
    `);
    console.log('✅ Campo updated_at agregado\n');

    // 4. Verificar la estructura actualizada
    console.log('📊 Verificando estructura de la tabla:');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      AND column_name IN ('created_by', 'created_at', 'updated_by', 'updated_at', 'fecha_registro')
      ORDER BY ordinal_position;
    `);
    
    console.table(result.rows);

    console.log('\n🎉 Campos de auditoría agregados exitosamente!');
    console.log('📋 Ahora el sistema registrará:');
    console.log('   - Quién creó el cliente (created_by)');
    console.log('   - Cuándo se creó (created_at / fecha_registro)');
    console.log('   - Quién lo modificó (updated_by)');
    console.log('   - Cuándo se modificó (updated_at)');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addAuditFields();
