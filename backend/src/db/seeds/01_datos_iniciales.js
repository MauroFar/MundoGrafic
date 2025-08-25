/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Limpiar datos existentes (en orden inverso por dependencias)
  await knex('detalle_orden_trabajo').del();
  await knex('orden_trabajo').del();
  await knex('detalle_cotizacion').del();
  await knex('cotizaciones').del();
  await knex('usuarios').del();
  await knex('clientes').del();
  await knex('rucs').del();
  await knex('areas').del();

  // Insertar datos de áreas
  await knex('areas').insert([
    { id: 1, nombre: 'Ventas' },
    { id: 2, nombre: 'Produccion' },
    { id: 3, nombre: 'administrador' }
  ]);

  // Insertar datos de usuarios
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

  // Insertar datos de clientes
  await knex('clientes').insert([
    {
      id: 1,
      nombre_cliente: 'Cliente Ejemplo',
      direccion_cliente: 'Dirección del cliente',
      telefono_cliente: '123456789',
      email_cliente: 'cliente@ejemplo.com'
    }
    // Agregar más clientes según los datos exportados
  ]);

  // Insertar datos de RUCs
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

  // Insertar datos de cotizaciones
  await knex('cotizaciones').insert([
    {
      id: 1,
      cliente_id: 1,
      fecha: new Date(),
      subtotal: 100.00,
      iva: 12.00,
      descuento: 0.00,
      total: 112.00,
      estado: 'pendiente',
      ruc_id: 1,
      numero_cotizacion: 'COT-001',
      tiempo_entrega: '5 días',
      forma_pago: 'Contado',
      validez_proforma: '30 días',
      observaciones: 'Observaciones de ejemplo',
      usuario_id: 1
    }
    // Agregar más cotizaciones según los datos exportados
  ]);

  // Insertar datos de detalle_cotizacion
  await knex('detalle_cotizacion').insert([
    {
      id: 1,
      cotizacion_id: 1,
      cantidad: 100,
      detalle: 'Tarjetas de presentación',
      valor_unitario: 0.50,
      valor_total: 50.00,
      imagen_ruta: null,
      imagen_height: null,
      imagen_width: null
    }
    // Agregar más detalles según los datos exportados
  ]);

  // Insertar datos de orden_trabajo
  await knex('orden_trabajo').insert([
    {
      id: 1,
      numero_orden: 'OT-001',
      nombre_cliente: 'Cliente Ejemplo',
      contacto: 'Contacto del cliente',
      email: 'cliente@ejemplo.com',
      telefono: '123456789',
      cantidad: 100,
      concepto: 'Tarjetas de presentación',
      fecha_creacion: new Date(),
      fecha_entrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
      estado: 'pendiente',
      notas_observaciones: 'Notas de ejemplo',
      vendedor: 'Vendedor Ejemplo',
      preprensa: false,
      prensa: false,
      terminados: false,
      facturado: false,
      id_cotizacion: 1,
      id_detalle_cotizacion: 1,
      created_at: new Date(),
      updated_at: new Date()
    }
    // Agregar más órdenes según los datos exportados
  ]);

  // Insertar datos de detalle_orden_trabajo
  await knex('detalle_orden_trabajo').insert([
    {
      id: 1,
      orden_trabajo_id: 1,
      material: 'Papel couché',
      corte_material: 'A4',
      cantidad_pliegos_compra: 25,
      exceso: 5,
      total_pliegos: 30,
      tamano: '9x5 cm',
      tamano_abierto_1: '9x5 cm',
      tamano_cerrado_1: '9x5 cm',
      impresion: '4/4',
      instrucciones_impresion: 'Impresión a color',
      instrucciones_acabados: 'Barniz UV',
      instrucciones_empacado: 'Empacado en cajas',
      observaciones: 'Observaciones de ejemplo',
      prensa_seleccionada: 'Prensa 1',
      created_at: new Date(),
      updated_at: new Date()
    }
    // Agregar más detalles según los datos exportados
  ]);

  console.log('✅ Datos iniciales insertados correctamente');
};
