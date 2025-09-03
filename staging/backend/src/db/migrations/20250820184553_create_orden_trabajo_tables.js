/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Crear tabla principal orden_trabajo
    .createTable('orden_trabajo', function(table) {
      table.increments('id').primary();
      table.string('numero_orden', 20).unique().notNullable();
      table.string('nombre_cliente', 255).notNullable();
      table.text('contacto');
      table.string('email', 255);
      table.string('telefono', 50);
      table.integer('cantidad');
      table.text('concepto');
      table.date('fecha_creacion').defaultTo(knex.fn.now());
      table.date('fecha_entrega');
      table.string('estado', 50).defaultTo('pendiente');
      table.text('notas_observaciones');
      table.string('vendedor', 100);
      table.string('preprensa', 100);
      table.string('prensa', 100);
      table.string('terminados', 100);
      table.string('facturado', 10);
      table.integer('id_cotizacion');
      table.integer('id_detalle_cotizacion');
      table.timestamps(true, true);
      
      // Índices para mejorar rendimiento
      table.index('numero_orden');
      table.index('nombre_cliente');
      table.index('fecha_creacion');
      table.index('estado');
    })
    
    // Crear tabla de detalle técnico detalle_orden_trabajo
    .createTable('detalle_orden_trabajo', function(table) {
      table.increments('id').primary();
      table.integer('orden_trabajo_id').notNullable().references('id').inTable('orden_trabajo').onDelete('CASCADE');
      
      // Nuevos campos de trabajo
      table.text('material');
      table.text('corte_material');
      table.integer('cantidad_pliegos_compra');
      table.integer('exceso');
      table.integer('total_pliegos');
      table.text('tamano');
      table.string('tamano_abierto_1', 50);
      table.string('tamano_cerrado_1', 50);
      table.text('impresion');
      table.text('instrucciones_impresion');
      table.text('instrucciones_acabados');
      table.text('instrucciones_empacado');
      table.text('observaciones');
      table.string('prensa_seleccionada', 100);
      
      table.timestamps(true, true);
      
      // Índice para la relación
      table.index('orden_trabajo_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('detalle_orden_trabajo')
    .dropTable('orden_trabajo');
};
