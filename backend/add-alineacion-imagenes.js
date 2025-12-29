require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistema_mg',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function addAlineacionColumn() {
  try {
    console.log('🔧 Agregando campo de alineación a detalle_cotizacion...');
    
    // Agregar columna alineacion_imagenes
    await pool.query(`
      ALTER TABLE detalle_cotizacion 
      ADD COLUMN IF NOT EXISTS alineacion_imagenes VARCHAR(20) DEFAULT 'horizontal';
    `);
    
    console.log('✅ Columna alineacion_imagenes agregada');
    
    // Actualizar registros existentes
    await pool.query(`
      UPDATE detalle_cotizacion 
      SET alineacion_imagenes = 'horizontal' 
      WHERE alineacion_imagenes IS NULL;
    `);
    
    console.log('✅ Registros existentes actualizados con alineación horizontal');
    console.log('✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addAlineacionColumn();
