const knex = require('knex')(require('./knexfile.js').development);

async function checkTables() {
  try {
    console.log('🔍 Verificando existencia de tablas...');
    
    // Verificar si existe orden_trabajo
    const ordenTrabajoExists = await knex.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orden_trabajo'
      );
    `);
    console.log('Tabla orden_trabajo existe:', ordenTrabajoExists.rows[0].exists);

    // Verificar si existe detalle_orden_trabajo
    const detalleExists = await knex.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'detalle_orden_trabajo'
      );
    `);
    console.log('Tabla detalle_orden_trabajo existe:', detalleExists.rows[0].exists);

    // Listar todas las tablas
    const allTables = await knex.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n📋 Todas las tablas en la base de datos:');
    allTables.rows.forEach(row => {
      console.log('  •', row.table_name);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

checkTables();
