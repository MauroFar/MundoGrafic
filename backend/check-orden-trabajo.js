const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mundografic',
  user: 'postgres',
  password: 'admin'
});

pool.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'orden_trabajo' 
  ORDER BY ordinal_position
`).then(result => {
  console.log('\n📋 Columnas de la tabla orden_trabajo:');
  console.log('=====================================');
  result.rows.forEach(row => {
    console.log(`  - ${row.column_name}: ${row.data_type}`);
  });
  pool.end();
}).catch(error => {
  console.error('❌ Error:', error.message);
  pool.end();
});
