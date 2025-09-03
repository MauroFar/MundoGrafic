const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mundografic',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
});

// Crear tabla de control de migraciones si no existe
async function createMigrationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      );
    `);
    console.log('✅ Tabla de migraciones creada/verificada');
  } catch (error) {
    console.error('❌ Error creando tabla de migraciones:', error);
    throw error;
  }
}

// Obtener migraciones ejecutadas
async function getExecutedMigrations() {
  const result = await pool.query('SELECT filename FROM migrations ORDER BY id');
  return result.rows.map(row => row.filename);
}

// Obtener todos los archivos de migración
async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = await fs.readdir(migrationsDir);
  return files
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ordenar alfabéticamente
}

// Ejecutar una migración
async function executeMigration(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  const sql = await fs.readFile(filePath, 'utf8');
  
  try {
    await pool.query('BEGIN');
    
    // Ejecutar el SQL de la migración
    await pool.query(sql);
    
    // Registrar la migración como ejecutada
    await pool.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
    
    await pool.query('COMMIT');
    console.log(`✅ Migración ejecutada: ${filename}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`❌ Error ejecutando migración ${filename}:`, error);
    throw error;
  }
}

// Función principal
async function runMigrations() {
  try {
    console.log('🚀 Iniciando proceso de migraciones...');
    
    // Crear tabla de control
    await createMigrationsTable();
    
    // Obtener migraciones ejecutadas y disponibles
    const executedMigrations = await getExecutedMigrations();
    const availableMigrations = await getMigrationFiles();
    
    console.log(`📋 Migraciones ejecutadas: ${executedMigrations.length}`);
    console.log(`📋 Migraciones disponibles: ${availableMigrations.length}`);
    
    // Encontrar migraciones pendientes
    const pendingMigrations = availableMigrations.filter(
      migration => !executedMigrations.includes(migration)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No hay migraciones pendientes');
      return;
    }
    
    console.log(`🔄 Ejecutando ${pendingMigrations.length} migraciones pendientes...`);
    
    // Ejecutar migraciones pendientes
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('✅ Todas las migraciones han sido ejecutadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error en el proceso de migraciones:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
