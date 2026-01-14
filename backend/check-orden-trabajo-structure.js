const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mundografic',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkOrdenTrabajoStructure() {
  try {
    console.log('🔍 Verificando estructura de tabla orden_trabajo...\n');
    
    // Consultar columnas
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'orden_trabajo' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columnas encontradas:');
    console.table(columns.rows);
    
    // Consultar índices
    const indexes = await pool.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'orden_trabajo'
    `);
    
    console.log('\n🔑 Índices:');
    console.table(indexes.rows);
    
    // Consultar valores distintos de estado
    const estados = await pool.query(`
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM orden_trabajo 
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    console.log('\n📊 Estados actuales en uso:');
    console.table(estados.rows);
    
    // Contar órdenes por estado
    const total = await pool.query(`
      SELECT COUNT(*) as total FROM orden_trabajo
    `);
    
    console.log(`\n✅ Total de órdenes de trabajo: ${total.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrdenTrabajoStructure();
