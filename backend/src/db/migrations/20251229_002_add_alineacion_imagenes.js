/**
 * Migración: Agregar campo de alineación de imágenes
 * Fecha: 2025-12-29
 * Descripción: Permite elegir alineación horizontal o vertical para imágenes de cada producto
 */

exports.up = function(knex) {
  return knex.schema.table('detalle_cotizacion', table => {
    table.string('alineacion_imagenes', 20).defaultTo('horizontal')
      .comment('Alineación de imágenes: horizontal o vertical');
  }).then(() => {
    console.log('✅ Campo alineacion_imagenes agregado a detalle_cotizacion');
  });
};

exports.down = function(knex) {
  return knex.schema.table('detalle_cotizacion', table => {
    table.dropColumn('alineacion_imagenes');
  }).then(() => {
    console.log('✅ Campo alineacion_imagenes eliminado');
  });
};
