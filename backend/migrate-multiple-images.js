require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistema_mg',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const sql = fs.readFileSync('src/db/migrations/20250129_create_detalle_imagenes.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Migración ejecutada correctamente');
    console.log('✅ Tabla detalle_cotizacion_imagenes creada');
    console.log('✅ Imágenes existentes migradas');
    pool.end();
  })
  .catch(err => {
    console.error('❌ Error al ejecutar migración:', err.message);
    pool.end();
    process.exit(1);
  });
