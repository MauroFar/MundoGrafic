const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function addAuditFields() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    console.log('\n🔧 Agregando campos de auditoría a cotizaciones...\n');

    // 1. Agregar created_by (quien creó la cotización)
    try {
      console.log('1️⃣  Agregando created_by...');
      await client.query(`
        ALTER TABLE cotizaciones 
        ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES usuarios(id)
      `);
      console.log('   ✅ created_by agregado\n');
    } catch (error) {
      console.log('   ⚠️  created_by ya existe o hubo un error:', error.message, '\n');
    }

    // 2. Agregar updated_by (quien modificó por última vez)
    try {
      console.log('2️⃣  Agregando updated_by...');
      await client.query(`
        ALTER TABLE cotizaciones 
        ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES usuarios(id)
      `);
      console.log('   ✅ updated_by agregado\n');
    } catch (error) {
      console.log('   ⚠️  updated_by ya existe o hubo un error:', error.message, '\n');
    }

    // 3. Agregar updated_at (fecha de última modificación)
    try {
      console.log('3️⃣  Agregando updated_at...');
      await client.query(`
        ALTER TABLE cotizaciones 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
      `);
      console.log('   ✅ updated_at agregado\n');
    } catch (error) {
      console.log('   ⚠️  updated_at ya existe o hubo un error:', error.message, '\n');
    }

    // 4. Verificar la estructura
    console.log('📊 Verificando estructura de campos de auditoría...\n');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cotizaciones'
      AND column_name IN ('created_at', 'created_by', 'updated_by', 'updated_at')
      ORDER BY column_name
    `);

    console.log('📋 Estructura verificada:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n✅ ¡Campos de auditoría agregados exitosamente!\n');
    console.log('📝 Resumen:');
    console.log('   - created_by: Usuario que creó la cotización');
    console.log('   - updated_by: Usuario que modificó por última vez');
    console.log('   - updated_at: Fecha de última modificación');
    console.log('\n💡 Siguiente paso: Actualizar las rutas del backend para capturar req.user.id\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

addAuditFields();
