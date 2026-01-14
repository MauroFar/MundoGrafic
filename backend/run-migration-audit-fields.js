const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add-audit-fields-orden-trabajo.sql');
    console.log(`📄 Leyendo migración: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar la migración
    console.log('🚀 Ejecutando migración...');
    await client.query(sql);
    
    console.log('✅ Migración ejecutada exitosamente');
    
    // Verificar resultado
    console.log('\n📊 Verificando campos agregados:');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'orden_trabajo' 
      AND column_name IN ('created_at', 'updated_at')
      ORDER BY column_name
    `);
    
    console.table(result.rows);
    
    // Contar registros actualizados
    const count = await client.query(`
      SELECT COUNT(*) as total 
      FROM orden_trabajo 
      WHERE created_at IS NOT NULL AND updated_at IS NOT NULL
    `);
    
    console.log(`\n✅ ${count.rows[0].total} registros tienen los campos de auditoría configurados`);
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

runMigration();
