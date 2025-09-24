// Migración segura para eliminar la columna redundante nombre_ejecutivo

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('cotizaciones', 'nombre_ejecutivo');
  if (hasColumn) {
    await knex.schema.alterTable('cotizaciones', (table) => {
      table.dropColumn('nombre_ejecutivo');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('cotizaciones', 'nombre_ejecutivo');
  if (!hasColumn) {
    await knex.schema.alterTable('cotizaciones', (table) => {
      table.string('nombre_ejecutivo', 255).nullable();
    });
  }
};


