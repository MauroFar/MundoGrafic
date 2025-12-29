/**
 * Migración: Crear tabla para múltiples imágenes por producto
 * Fecha: 2025-12-29
 * Descripción: Permite agregar múltiples imágenes a cada item de cotización
 */

exports.up = function(knex) {
  return knex.schema.createTable('detalle_cotizacion_imagenes', table => {
    table.increments('id').primary();
    table.integer('detalle_cotizacion_id')
      .notNullable()
      .references('id')
      .inTable('detalle_cotizacion')
      .onDelete('CASCADE')
      .comment('Relación con detalle de cotización');
    table.string('imagen_ruta', 500).notNullable().comment('Ruta de la imagen');
    table.integer('orden').defaultTo(0).comment('Orden de visualización');
    table.integer('imagen_width').defaultTo(200).comment('Ancho de imagen en PDF');
    table.integer('imagen_height').defaultTo(150).comment('Alto de imagen en PDF');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Índices para mejorar rendimiento
    table.index('detalle_cotizacion_id');
    table.index('orden');
  }).then(() => {
    console.log('✅ Tabla detalle_cotizacion_imagenes creada exitosamente');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('detalle_cotizacion_imagenes')
    .then(() => {
      console.log('✅ Tabla detalle_cotizacion_imagenes eliminada');
    });
};
