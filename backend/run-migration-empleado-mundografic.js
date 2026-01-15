require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function runMigration() {
  try {
    await client.connect();
    console.log('🔄 Ejecutando migración: add-empleado-mundografic-field.sql\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add-empleado-mundografic-field.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar la migración
    await client.query(sqlContent);

    console.log('\n✅ Migración completada exitosamente!\n');

    // Mostrar resumen
    const result = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE es_empleado_mundografic = true) as empleados,
        COUNT(*) FILTER (WHERE es_empleado_mundografic = false) as externos,
        COUNT(*) as total
      FROM usuarios
    `);

    console.log('📊 Estado actual de usuarios:');
    console.log(`   • Empleados MundoGrafic: ${result.rows[0].empleados}`);
    console.log(`   • Usuarios externos: ${result.rows[0].externos}`);
    console.log(`   • Total: ${result.rows[0].total}\n`);

  } catch (error) {
    console.error('\n❌ Error ejecutando migración:', error.message);
    console.error('Detalles:', error);
  } finally {
    await client.end();
  }
}

runMigration();
