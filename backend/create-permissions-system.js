require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function createPermissionsSystem() {
  try {
    await client.connect();
    console.log('🔄 Creando sistema de permisos...\n');

    await client.query('BEGIN');

    // 1. Crear tabla de permisos de usuarios
    console.log('📋 Creando tabla usuarios_permisos...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios_permisos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        modulo VARCHAR(50) NOT NULL,
        puede_crear BOOLEAN DEFAULT false,
        puede_leer BOOLEAN DEFAULT true,
        puede_editar BOOLEAN DEFAULT false,
        puede_eliminar BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(usuario_id, modulo)
      );
    `);
    console.log('✅ Tabla usuarios_permisos creada');

    // 2. Crear índices para optimizar consultas
    console.log('\n📊 Creando índices...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_permisos_usuario 
      ON usuarios_permisos(usuario_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_permisos_modulo 
      ON usuarios_permisos(usuario_id, modulo);
    `);
    console.log('✅ Índices creados');

    // 3. Insertar permisos por defecto para usuarios admin existentes
    console.log('\n🔑 Configurando permisos para administradores...');
    
    const adminUsers = await client.query(`
      SELECT id FROM usuarios WHERE rol = 'admin'
    `);

    const modulos = [
      'clientes',
      'cotizaciones', 
      'ordenes_trabajo',
      'produccion',
      'inventario',
      'usuarios',
      'reportes'
    ];

    for (const admin of adminUsers.rows) {
      for (const modulo of modulos) {
        await client.query(`
          INSERT INTO usuarios_permisos 
          (usuario_id, modulo, puede_crear, puede_leer, puede_editar, puede_eliminar)
          VALUES ($1, $2, true, true, true, true)
          ON CONFLICT (usuario_id, modulo) DO NOTHING
        `, [admin.id, modulo]);
      }
    }
    
    console.log(`✅ Permisos configurados para ${adminUsers.rows.length} administrador(es)`);

    await client.query('COMMIT');

    // 4. Verificar resultado
    console.log('\n📊 Resumen del sistema de permisos:');
    const stats = await client.query(`
      SELECT 
        COUNT(DISTINCT usuario_id) as usuarios_con_permisos,
        COUNT(*) as total_permisos
      FROM usuarios_permisos
    `);
    
    console.log(`   - Usuarios con permisos: ${stats.rows[0].usuarios_con_permisos}`);
    console.log(`   - Total de permisos configurados: ${stats.rows[0].total_permisos}`);
    
    console.log('\n✅ Sistema de permisos creado exitosamente!');
    console.log('\n📝 Módulos disponibles:');
    modulos.forEach(mod => console.log(`   - ${mod}`));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createPermissionsSystem();
