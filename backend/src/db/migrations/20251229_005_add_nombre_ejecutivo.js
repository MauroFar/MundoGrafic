/**
 * Migración: Restaurar y hacer editable el campo nombre_ejecutivo
 * Fecha: 2025-12-29
 * Descripción: Permite personalizar el nombre del ejecutivo en cada cotización
 */

exports.up = async function(knex) {
  // Verificar si la columna existe
  const hasColumn = await knex.schema.hasColumn('cotizaciones', 'nombre_ejecutivo');
  
  if (!hasColumn) {
    await knex.schema.table('cotizaciones', table => {
      table.string('nombre_ejecutivo', 255)
        .comment('Nombre del ejecutivo (editable por el usuario)');
    });
    console.log('✅ Campo nombre_ejecutivo agregado a cotizaciones');
  } else {
    console.log('ℹ️  Campo nombre_ejecutivo ya existe');
  }

  // Llenar valores NULL con el nombre del usuario relacionado
  await knex.raw(`
    UPDATE cotizaciones c
    SET nombre_ejecutivo = u.nombre
    FROM usuarios u
    WHERE c.usuario_id = u.id
      AND c.nombre_ejecutivo IS NULL
  `);

  console.log('✅ Valores NULL actualizados con nombre de usuario');
};

exports.down = function(knex) {
  // No eliminar la columna para no perder datos
  console.log('⚠️  No se elimina nombre_ejecutivo para preservar datos');
};
