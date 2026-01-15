require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function verificarCampo() {
  try {
    await client.connect();
    console.log('🔗 Conectado a la base de datos\n');

    // Verificar estructura del campo
    console.log('📋 ESTRUCTURA DEL CAMPO es_empleado_mundografic:\n');
    const fieldInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'usuarios' 
      AND column_name = 'es_empleado_mundografic'
    `);
    
    if (fieldInfo.rows.length === 0) {
      console.log('❌ El campo NO existe en la tabla usuarios');
    } else {
      console.table(fieldInfo.rows);
    }

    // Ver usuarios
    console.log('\n👥 USUARIOS EN LA BASE DE DATOS:\n');
    const usuarios = await client.query(`
      SELECT 
        id, 
        nombre, 
        email, 
        rol, 
        es_empleado_mundografic as es_empleado,
        activo
      FROM usuarios
      ORDER BY id
    `);
    console.table(usuarios.rows);

    // Estadísticas
    console.log('\n📊 ESTADÍSTICAS:\n');
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE es_empleado_mundografic = true) as empleados_mg,
        COUNT(*) FILTER (WHERE es_empleado_mundografic = false) as externos
      FROM usuarios
    `);
    console.table(stats.rows);

    await client.end();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarCampo();
