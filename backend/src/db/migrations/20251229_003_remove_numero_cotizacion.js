/**
 * Migración: Eliminar campo numero_cotizacion y secuencia
 * Fecha: 2025-12-29
 * Descripción: Simplifica el sistema de numeración usando solo codigo_cotizacion
 */

exports.up = async function(knex) {
  // 1. Verificar que todas las cotizaciones tengan codigo_cotizacion
  const sinCodigo = await knex('cotizaciones')
    .whereNull('codigo_cotizacion')
    .count('* as count')
    .first();
  
  if (sinCodigo.count > 0) {
    console.log(`⚠️  Actualizando ${sinCodigo.count} cotizaciones sin código...`);
    // Generar códigos para las que no tienen
    const cotizaciones = await knex('cotizaciones')
      .whereNull('codigo_cotizacion')
      .select('id')
      .orderBy('id');
    
    for (const cot of cotizaciones) {
      await knex('cotizaciones')
        .where('id', cot.id)
        .update({
          codigo_cotizacion: String(cot.id).padStart(9, '0')
        });
    }
  }

  // 2. Eliminar secuencia si existe
  await knex.raw('DROP SEQUENCE IF EXISTS cotizaciones_numero_cotizacion_seq CASCADE');
  console.log('✅ Secuencia cotizaciones_numero_cotizacion_seq eliminada');

  // 3. Eliminar columna numero_cotizacion
  return knex.schema.table('cotizaciones', table => {
    table.dropColumn('numero_cotizacion');
  }).then(() => {
    console.log('✅ Campo numero_cotizacion eliminado');
  });
};

exports.down = async function(knex) {
  // Restaurar numero_cotizacion (solo estructura, datos no recuperables)
  await knex.schema.table('cotizaciones', table => {
    table.integer('numero_cotizacion');
  });

  // Recrear secuencia
  await knex.raw('CREATE SEQUENCE IF NOT EXISTS cotizaciones_numero_cotizacion_seq START 1');
  
  console.log('✅ Campo numero_cotizacion y secuencia restaurados (sin datos)');
};
