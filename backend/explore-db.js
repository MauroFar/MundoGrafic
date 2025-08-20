const knex = require('knex');
const knexConfig = require('./knexfile');

// Crear instancia de Knex
const db = knex(knexConfig.development);

async function exploreDatabase() {
  try {
    console.log('🔍 Explorando estructura de la base de datos...\n');

    // Obtener todas las tablas
    const tables = await db.raw(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📊 Encontradas ${tables.rows.length} tablas:\n`);

    // Para cada tabla, obtener su estructura
    for (const table of tables.rows) {
      console.log(`📋 Tabla: ${table.table_name}`);
      console.log('─'.repeat(50));

      // Obtener columnas
      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = ? 
        ORDER BY ordinal_position;
      `, [table.table_name]);

      console.log('Columnas:');
      columns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  • ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultValue}`);
      });

      // Obtener restricciones
      const constraints = await db.raw(`
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
        WHERE tc.table_name = ?;
      `, [table.table_name]);

      if (constraints.rows.length > 0) {
        console.log('\nRestricciones:');
        constraints.rows.forEach(con => {
          if (con.constraint_type === 'FOREIGN KEY') {
            console.log(`  • FK: ${con.column_name} → ${con.foreign_table_name}.${con.foreign_column_name}`);
          } else if (con.constraint_type === 'PRIMARY KEY') {
            console.log(`  • PK: ${con.column_name}`);
          } else if (con.constraint_type === 'UNIQUE') {
            console.log(`  • UNIQUE: ${con.column_name}`);
          }
        });
      }

      // Obtener índices
      const indexes = await db.raw(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = ?;
      `, [table.table_name]);

      if (indexes.rows.length > 0) {
        console.log('\nÍndices:');
        indexes.rows.forEach(idx => {
          console.log(`  • ${idx.indexname}`);
        });
      }

      // Contar registros
      const count = await db(table.table_name).count('* as total');
      console.log(`\n📈 Registros: ${count[0].total}`);

      console.log('\n' + '='.repeat(60) + '\n');
    }

    // Mostrar funciones y triggers
    console.log('🔧 Funciones y Triggers:');
    console.log('─'.repeat(50));

    const functions = await db.raw(`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public';
    `);

    if (functions.rows.length > 0) {
      console.log('Funciones:');
      functions.rows.forEach(func => {
        console.log(`  • ${func.routine_name} (${func.routine_type})`);
      });
    }

    const triggers = await db.raw(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public';
    `);

    if (triggers.rows.length > 0) {
      console.log('\nTriggers:');
      triggers.rows.forEach(trig => {
        console.log(`  • ${trig.trigger_name} (${trig.event_manipulation} en ${trig.event_object_table})`);
      });
    }

    console.log('\n✅ Exploración completada');

  } catch (error) {
    console.error('❌ Error explorando la base de datos:', error);
  } finally {
    await db.destroy();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  exploreDatabase();
}

module.exports = { exploreDatabase };
