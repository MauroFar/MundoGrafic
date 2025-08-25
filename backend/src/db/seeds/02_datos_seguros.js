/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🔒 Ejecutando seed seguro (sin borrar datos existentes)...');

  // Verificar si ya existen datos antes de insertar
  const areasExistentes = await knex('areas').count('* as count').first();
  if (areasExistentes.count == 0) {
    console.log('📝 Insertando áreas...');
    await knex('areas').insert([
      { id: 1, nombre: 'Ventas' },
      { id: 2, nombre: 'Produccion' },
      { id: 3, nombre: 'administrador' }
    ]);
  } else {
    console.log('ℹ️  Áreas ya existen, saltando...');
  }

  // Verificar usuarios existentes
  const usuariosExistentes = await knex('usuarios').count('* as count').first();
  if (usuariosExistentes.count == 0) {
    console.log('📝 Insertando usuario administrador...');
    await knex('usuarios').insert([
      {
        id: 1,
        email: 'mauro_far@outlook.com',
        password_hash: '$2b$10$OxiJAi/p/GgVYk233vUAaeU5t/vxqfTG2tTKhojH0tSKKXOipQwT2',
        nombre: 'Mauro Farinango',
        rol: 'admin',
        area_id: 3,
        activo: true,
        fecha_creacion: new Date('2025-06-30 10:29:21.176928'),
        nombre_usuario: 'administrador'
      }
    ]);
  } else {
    console.log('ℹ️  Usuarios ya existen, saltando...');
  }

  // Verificar RUCs existentes
  const rucsExistentes = await knex('rucs').count('* as count').first();
  if (rucsExistentes.count == 0) {
    console.log('📝 Insertando RUCs...');
    await knex('rucs').insert([
      {
        id: 1,
        ruc: '1710047984001',
        descripcion: 'JCP'
      },
      {
        id: 2,
        ruc: '1792668026001',
        descripcion: 'CIA'
      }
    ]);
  } else {
    console.log('ℹ️  RUCs ya existen, saltando...');
  }

  console.log('✅ Seed seguro completado');
};
