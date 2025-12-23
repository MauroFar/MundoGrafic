/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Tabla de seguimiento de estados
    .createTable('seguimiento_orden', function(table) {
      table.increments('id').primary();
      table.integer('orden_trabajo_id').notNullable();
      table.string('estado_anterior', 50);
      table.string('estado_actual', 50).notNullable();
      table.string('responsable', 100);
      table.timestamp('fecha_cambio').defaultTo(knex.fn.now());
      table.text('observaciones');
      table.integer('tiempo_estimado'); // en minutos
      table.integer('tiempo_real'); // en minutos
      table.timestamps(true, true);
      
      // Índices
      table.index('orden_trabajo_id');
      table.index('fecha_cambio');
      table.index('estado_actual');
      
      // Foreign key
      table.foreign('orden_trabajo_id').references('id').inTable('orden_trabajo').onDelete('CASCADE');
    })
    
    // Tabla de responsables por área
    .createTable('responsables_area', function(table) {
      table.increments('id').primary();
      table.string('area', 50).notNullable(); // preprensa, prensa, acabados, etc.
      table.string('responsable', 100).notNullable();
      table.boolean('activo').defaultTo(true);
      table.timestamps(true, true);
      
      // Índices
      table.index('area');
      table.index('activo');
    })
    
    // Tabla de archivos de preprensa
    .createTable('archivos_preprensa', function(table) {
      table.increments('id').primary();
      table.integer('orden_trabajo_id').notNullable();
      table.string('nombre_archivo', 255).notNullable();
      table.string('ruta_archivo', 500).notNullable();
      table.string('tipo_archivo', 50); // pdf, ai, psd, etc.
      table.integer('tamaño_archivo'); // en bytes
      table.text('descripcion');
      table.timestamp('fecha_subida').defaultTo(knex.fn.now());
      table.timestamps(true, true);
      
      // Índices
      table.index('orden_trabajo_id');
      table.index('tipo_archivo');
      
      // Foreign key
      table.foreign('orden_trabajo_id').references('id').inTable('orden_trabajo').onDelete('CASCADE');
    })
    
    // Tabla de criterios de calidad
    .createTable('criterios_calidad', function(table) {
      table.increments('id').primary();
      table.string('codigo', 50).notNullable().unique();
      table.string('nombre', 100).notNullable();
      table.text('descripcion');
      table.boolean('obligatorio').defaultTo(true);
      table.integer('orden').defaultTo(0);
      table.boolean('activo').defaultTo(true);
      table.timestamps(true, true);
      
      // Índices
      table.index('codigo');
      table.index('activo');
    })
    
    // Tabla de inspecciones de calidad
    .createTable('inspecciones_calidad', function(table) {
      table.increments('id').primary();
      table.integer('orden_trabajo_id').notNullable();
      table.integer('criterio_id').notNullable();
      table.boolean('aprobado').notNullable();
      table.text('observaciones');
      table.string('inspector', 100);
      table.timestamp('fecha_inspeccion').defaultTo(knex.fn.now());
      table.timestamps(true, true);
      
      // Índices
      table.index('orden_trabajo_id');
      table.index('criterio_id');
      table.index('fecha_inspeccion');
      
      // Foreign keys
      table.foreign('orden_trabajo_id').references('id').inTable('orden_trabajo').onDelete('CASCADE');
      table.foreign('criterio_id').references('id').inTable('criterios_calidad').onDelete('CASCADE');
    })
    
    // Tabla de prensas disponibles
    .createTable('prensas', function(table) {
      table.increments('id').primary();
      table.string('codigo', 20).notNullable().unique();
      table.string('nombre', 100).notNullable();
      table.string('capacidad', 50); // A4, A3, etc.
      table.integer('velocidad_maxima'); // impresiones por hora
      table.string('estado', 20).defaultTo('disponible'); // disponible, ocupada, mantenimiento
      table.text('especificaciones');
      table.boolean('activa').defaultTo(true);
      table.timestamps(true, true);
      
      // Índices
      table.index('codigo');
      table.index('estado');
      table.index('activa');
    })
    
    // Tabla de asignaciones de prensa
    .createTable('asignaciones_prensa', function(table) {
      table.increments('id').primary();
      table.integer('orden_trabajo_id').notNullable();
      table.integer('prensa_id').notNullable();
      table.timestamp('fecha_asignacion').defaultTo(knex.fn.now());
      table.timestamp('fecha_inicio');
      table.timestamp('fecha_fin');
      table.string('responsable', 100);
      table.text('observaciones');
      table.timestamps(true, true);
      
      // Índices
      table.index('orden_trabajo_id');
      table.index('prensa_id');
      table.index('fecha_asignacion');
      
      // Foreign keys
      table.foreign('orden_trabajo_id').references('id').inTable('orden_trabajo').onDelete('CASCADE');
      table.foreign('prensa_id').references('id').inTable('prensas').onDelete('CASCADE');
    })
    
    // Tabla de tipos de acabado
    .createTable('tipos_acabado', function(table) {
      table.increments('id').primary();
      table.string('codigo', 50).notNullable().unique();
      table.string('nombre', 100).notNullable();
      table.text('descripcion');
      table.integer('tiempo_estimado'); // en minutos
      table.decimal('costo_base', 10, 2);
      table.boolean('activo').defaultTo(true);
      table.timestamps(true, true);
      
      // Índices
      table.index('codigo');
      table.index('activo');
    })
    
    // Tabla de procesos de acabado
    .createTable('procesos_acabado', function(table) {
      table.increments('id').primary();
      table.integer('orden_trabajo_id').notNullable();
      table.integer('tipo_acabado_id').notNullable();
      table.string('estado', 20).defaultTo('pendiente'); // pendiente, en_proceso, completado
      table.string('responsable', 100);
      table.timestamp('fecha_inicio');
      table.timestamp('fecha_fin');
      table.integer('tiempo_real'); // en minutos
      table.text('observaciones');
      table.timestamps(true, true);
      
      // Índices
      table.index('orden_trabajo_id');
      table.index('tipo_acabado_id');
      table.index('estado');
      
      // Foreign keys
      table.foreign('orden_trabajo_id').references('id').inTable('orden_trabajo').onDelete('CASCADE');
      table.foreign('tipo_acabado_id').references('id').inTable('tipos_acabado').onDelete('CASCADE');
    })
    
    // Tabla de métodos de entrega
    .createTable('metodos_entrega', function(table) {
      table.increments('id').primary();
      table.string('codigo', 50).notNullable().unique();
      table.string('nombre', 100).notNullable();
      table.text('descripcion');
      table.decimal('costo_base', 10, 2);
      table.integer('tiempo_estimado'); // en horas
      table.boolean('activo').defaultTo(true);
      table.timestamps(true, true);
      
      // Índices
      table.index('codigo');
      table.index('activo');
    })
    
    // Tabla de entregas
    .createTable('entregas', function(table) {
      table.increments('id').primary();
      table.integer('orden_trabajo_id').notNullable();
      table.integer('metodo_entrega_id').notNullable();
      table.string('estado', 20).defaultTo('pendiente'); // pendiente, programada, en_transito, entregada
      table.timestamp('fecha_programada');
      table.timestamp('fecha_entrega');
      table.string('direccion_entrega', 500);
      table.string('contacto_entrega', 100);
      table.string('telefono_contacto', 20);
      table.string('responsable_entrega', 100);
      table.text('observaciones');
      table.string('comprobante_entrega', 500); // ruta del archivo
      table.timestamps(true, true);
      
      // Índices
      table.index('orden_trabajo_id');
      table.index('metodo_entrega_id');
      table.index('estado');
      table.index('fecha_programada');
      
      // Foreign keys
      table.foreign('orden_trabajo_id').references('id').inTable('orden_trabajo').onDelete('CASCADE');
      table.foreign('metodo_entrega_id').references('id').inTable('metodos_entrega').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('entregas')
    .dropTableIfExists('metodos_entrega')
    .dropTableIfExists('procesos_acabado')
    .dropTableIfExists('tipos_acabado')
    .dropTableIfExists('asignaciones_prensa')
    .dropTableIfExists('prensas')
    .dropTableIfExists('inspecciones_calidad')
    .dropTableIfExists('criterios_calidad')
    .dropTableIfExists('archivos_preprensa')
    .dropTableIfExists('responsables_area')
    .dropTableIfExists('seguimiento_orden');
};
