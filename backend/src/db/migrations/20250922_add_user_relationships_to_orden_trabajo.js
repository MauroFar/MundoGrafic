/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  // Agregar columnas de relación con usuarios y sus índices/foreign keys
  await knex.schema.alterTable('orden_trabajo', (table) => {
    table.integer('created_by').notNullable();
    table.integer('responsable_id').nullable();
  });

  // Índices para performance en joins y filtros
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_orden_trabajo_created_by ON public.orden_trabajo(created_by)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_orden_trabajo_responsable_id ON public.orden_trabajo(responsable_id)');

  // Constraints de integridad referencial
  await knex.schema.alterTable('orden_trabajo', (table) => {
    table
      .foreign('created_by', 'orden_trabajo_created_by_fk')
      .references('id')
      .inTable('usuarios')
      .onUpdate('RESTRICT')
      .onDelete('RESTRICT');

    table
      .foreign('responsable_id', 'orden_trabajo_responsable_id_fk')
      .references('id')
      .inTable('usuarios')
      .onUpdate('RESTRICT')
      .onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  // Quitar FKs primero
  await knex.schema.alterTable('orden_trabajo', (table) => {
    table.dropForeign('created_by', 'orden_trabajo_created_by_fk');
    table.dropForeign('responsable_id', 'orden_trabajo_responsable_id_fk');
  });

  // Quitar índices
  await knex.raw('DROP INDEX IF EXISTS idx_orden_trabajo_created_by');
  await knex.raw('DROP INDEX IF EXISTS idx_orden_trabajo_responsable_id');

  // Quitar columnas
  await knex.schema.alterTable('orden_trabajo', (table) => {
    table.dropColumn('created_by');
    table.dropColumn('responsable_id');
  });
};



