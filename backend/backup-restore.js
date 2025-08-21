const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

async function restoreFromBackup() {
  console.log('🔄 Restaurando base de datos desde backup...');
  
  // Buscar el archivo de backup más reciente
  const backupDir = path.join(__dirname, 'backups');
  const backupFiles = await fs.readdir(backupDir);
  const jsonBackups = backupFiles.filter(file => file.endsWith('.json')).sort().reverse();
  
  if (jsonBackups.length === 0) {
    console.error('❌ No se encontraron archivos de backup');
    return;
  }
  
  const latestBackup = jsonBackups[0];
  const backupPath = path.join(backupDir, latestBackup);
  
  console.log(`📁 Usando backup: ${latestBackup}`);
  
  try {
    // Leer archivo de backup
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
    console.log(`📊 Backup de: ${backupData.database} (${backupData.timestamp})`);
    
    // Conectar a la base de datos
    const client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });
    
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    // Crear tablas y restaurar datos
    for (const table of backupData.tables) {
      console.log(`🔄 Procesando tabla: ${table.name}`);
      
      try {
        // Crear tabla si no existe
        if (table.structure && table.structure.length > 0) {
          const createTableSQL = generateCreateTableSQL(table.name, table.structure);
          await client.query(createTableSQL);
          console.log(`   ✅ Tabla ${table.name} creada/verificada`);
        }
        
        // Restaurar datos si existen
        if (table.data && table.data.length > 0) {
          // Limpiar tabla existente
          await client.query(`DELETE FROM "${table.name}"`);
          
          // Insertar datos
          for (const row of table.data) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            const insertQuery = `
              INSERT INTO "${table.name}" (${columns.map(col => `"${col}"`).join(', ')})
              VALUES (${placeholders})
            `;
            
            try {
              await client.query(insertQuery, values);
            } catch (error) {
              console.error(`   ⚠️  Error insertando en ${table.name}:`, error.message);
            }
          }
          
          console.log(`   ✅ ${table.data.length} registros restaurados en ${table.name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error procesando tabla ${table.name}:`, error.message);
      }
    }
    
    await client.end();
    console.log('🎉 Restore completado exitosamente!');
    
    // Verificar tablas creadas
    console.log('\n📋 Verificando tablas...');
    const verifyClient = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });
    
    await verifyClient.connect();
    const tablesResult = await verifyClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Tablas disponibles:');
    tablesResult.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    await verifyClient.end();
    
  } catch (error) {
    console.error('❌ Error durante el restore:', error);
    process.exit(1);
  }
}

function generateCreateTableSQL(tableName, columns) {
  const columnDefs = columns.map(col => {
    let def = `"${col.column_name}" ${col.data_type}`;
    
    if (col.character_maximum_length) {
      def += `(${col.character_maximum_length})`;
    }
    
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }
    
    return def;
  }).join(',\n  ');
  
  return `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      ${columnDefs}
    );
  `;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  restoreFromBackup();
}

module.exports = { restoreFromBackup };
