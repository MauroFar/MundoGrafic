require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function removeDuplicateColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    console.log('🔄 MIGRACION: Eliminar columnas duplicadas de la tabla clientes\n');

    await client.query('BEGIN');

    // 1. Verificar que las columnas existen antes de eliminarlas
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      AND column_name IN ('telefono', 'direccion');
    `);

    console.log(`📋 Columnas a eliminar encontradas: ${checkColumns.rows.length}`);
    checkColumns.rows.forEach(col => console.log(`   - ${col.column_name}`));

    if (checkColumns.rows.length === 0) {
      console.log('\n⚠️  No hay columnas duplicadas para eliminar');
      await client.query('ROLLBACK');
      return;
    }

    // 2. Crear backup de seguridad (opcional pero recomendado)
    console.log('\n💾 Creando tabla de respaldo...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')} 
      AS SELECT * FROM clientes;
    `);
    console.log('✅ Backup creado');

    // 3. Eliminar las columnas duplicadas
    console.log('\n🗑️  Eliminando columnas duplicadas...');
    
    for (const col of checkColumns.rows) {
      console.log(`   Eliminando columna: ${col.column_name}`);
      await client.query(`ALTER TABLE clientes DROP COLUMN IF EXISTS ${col.column_name};`);
    }

    // 4. Verificar el resultado
    const finalCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY ordinal_position;
    `);

    console.log('\n✅ MIGRACIÓN COMPLETADA');
    console.log(`\n📊 Columnas actuales en la tabla clientes (${finalCheck.rows.length}):`);
    finalCheck.rows.forEach((col, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${col.column_name}`);
    });

    await client.query('COMMIT');
    console.log('\n✅ Transacción confirmada exitosamente');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('⚠️  Se ha revertido la transacción');
  } finally {
    await client.end();
  }
}

removeDuplicateColumns();
