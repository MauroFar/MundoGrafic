/**
 * Agrega columna celular a usuarios (nullable) y crea índice opcional
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('usuarios', 'celular');
  if (!hasColumn) {
    await knex.schema.alterTable('usuarios', (table) => {
      table.string('celular', 30).nullable();
    });
  }
};

/**
 * Revierte la columna celular
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('usuarios', 'celular');
  if (hasColumn) {
    await knex.schema.alterTable('usuarios', (table) => {
      table.dropColumn('celular');
    });
  }
};


