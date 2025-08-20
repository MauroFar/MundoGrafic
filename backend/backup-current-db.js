const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

async function backupCurrentDatabase() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    // Obtener información de las tablas
    console.log('📋 Obteniendo información de las tablas...');
    
    const tablesQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const tables = tablesResult.rows;

    console.log(`📊 Encontradas ${tables.length} tablas:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Crear backup de la estructura
    const backupData = {
      timestamp: new Date().toISOString(),
      database: process.env.DB_NAME,
      tables: []
    };

    // Para cada tabla, obtener su estructura
    for (const table of tables) {
      console.log(`🔍 Analizando tabla: ${table.table_name}`);
      
      // Obtener estructura de la tabla
      const structureQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `;
      
      const structureResult = await client.query(structureQuery, [table.table_name]);
      
      // Obtener restricciones (PK, FK, etc.)
      const constraintsQuery = `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1;
      `;
      
      const constraintsResult = await client.query(constraintsQuery, [table.table_name]);
      
      // Obtener índices
      const indexesQuery = `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1;
      `;
      
      const indexesResult = await client.query(indexesQuery, [table.table_name]);
      
      backupData.tables.push({
        name: table.table_name,
        structure: structureResult.rows,
        constraints: constraintsResult.rows,
        indexes: indexesResult.rows
      });
    }

    // Guardar backup en archivo
    const backupDir = path.join(__dirname, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupFile = path.join(backupDir, `backup-${new Date().toISOString().split('T')[0]}.json`);
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup guardado en: ${backupFile}`);
    console.log('📋 Este backup contiene la estructura actual de tu BD');
    console.log('🔄 Ahora puedes empezar a usar migraciones con confianza');

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
  } finally {
    await client.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  backupCurrentDatabase();
}

module.exports = { backupCurrentDatabase };
