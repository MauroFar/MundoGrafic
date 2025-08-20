const knex = require('knex')(require('./knexfile.js').development);

async function exploreOrdenTrabajo() {
  try {
    console.log('🔍 Explorando tabla orden_trabajo...');
    const ordenTrabajoColumns = await knex.raw(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'orden_trabajo' 
      ORDER BY ordinal_position
    `);
    console.table(ordenTrabajoColumns.rows);

    console.log('\n🔍 Explorando tabla detalle_orden_trabajo...');
    const detalleColumns = await knex.raw(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'detalle_orden_trabajo' 
      ORDER BY ordinal_position
    `);
    console.table(detalleColumns.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

exploreOrdenTrabajo();
