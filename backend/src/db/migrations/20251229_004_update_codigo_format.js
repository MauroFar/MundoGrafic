/**
 * Migración: Asegurar que todas las cotizaciones tengan codigo_cotizacion en formato 9 dígitos
 * Fecha: 2025-12-29
 * Descripción: Actualiza códigos existentes al formato 000000001
 */

exports.up = async function(knex) {
  console.log('🔄 Actualizando formato de codigo_cotizacion a 9 dígitos...');
  
  // Actualizar todos los códigos al formato de 9 dígitos
  await knex.raw(`
    UPDATE cotizaciones 
    SET codigo_cotizacion = LPAD(id::TEXT, 9, '0')
    WHERE codigo_cotizacion IS NULL 
       OR codigo_cotizacion != LPAD(id::TEXT, 9, '0')
  `);

  const resultado = await knex('cotizaciones')
    .select('id', 'codigo_cotizacion')
    .orderBy('id')
    .limit(5);
  
  console.log('✅ Códigos actualizados. Ejemplos:');
  resultado.forEach(r => {
    console.log(`   ID ${r.id} → ${r.codigo_cotizacion}`);
  });
};

exports.down = async function(knex) {
  // No hay rollback necesario, los códigos quedan como están
  console.log('⚠️  No se realiza rollback de formato de códigos');
};
