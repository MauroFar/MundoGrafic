const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

async function setupServerDatabase() {
  console.log('🚀 Configurando base de datos en el servidor...');
  
  // Primero conectamos sin especificar base de datos para poder crearla
  const adminClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres' // Conectamos a la base de datos por defecto
  });

  try {
    console.log('🔌 Conectando al servidor PostgreSQL...');
    await adminClient.connect();
    console.log('✅ Conectado exitosamente');

    // Verificar si la base de datos ya existe
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const dbExists = await adminClient.query(checkDbQuery, [process.env.DB_NAME]);
    
    if (dbExists.rows.length === 0) {
      console.log(`📝 Creando base de datos: ${process.env.DB_NAME}`);
      await adminClient.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log('✅ Base de datos creada exitosamente');
    } else {
      console.log(`ℹ️  La base de datos ${process.env.DB_NAME} ya existe`);
    }

    await adminClient.end();

    // Ahora conectamos a la base de datos específica para crear las tablas
    const dbClient = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    await dbClient.connect();
    console.log(`🔌 Conectado a la base de datos: ${process.env.DB_NAME}`);

    // Ejecutar migraciones SQL
    console.log('📋 Ejecutando migraciones...');
    
    const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
    const migrationFiles = await fs.readdir(migrationsDir);
    
    // Ordenar archivos de migración por fecha
    const sortedMigrations = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const migrationFile of sortedMigrations) {
      console.log(`🔄 Ejecutando migración: ${migrationFile}`);
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');
      
      try {
        await dbClient.query(migrationSQL);
        console.log(`✅ Migración ${migrationFile} ejecutada exitosamente`);
      } catch (error) {
        console.error(`❌ Error en migración ${migrationFile}:`, error.message);
        // Continuar con las siguientes migraciones
      }
    }

    // Verificar tablas creadas
    console.log('📊 Verificando tablas creadas...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await dbClient.query(tablesQuery);
    console.log('📋 Tablas en la base de datos:');
    tablesResult.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    await dbClient.end();
    console.log('🎉 Configuración de base de datos completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupServerDatabase();
}

module.exports = { setupServerDatabase };
