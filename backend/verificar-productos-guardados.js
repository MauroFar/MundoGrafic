const { Client } = require('pg');
require('dotenv').config();

async function verificarProductos() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener última orden digital
    const ordenResult = await client.query(`
      SELECT id, numero_orden, nombre_cliente, tipo_orden, created_at
      FROM orden_trabajo 
      WHERE tipo_orden = 'digital'
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (ordenResult.rows.length === 0) {
      console.log('⚠️  No hay órdenes digitales en la base de datos');
      return;
    }

    const orden = ordenResult.rows[0];
    console.log('📋 Última orden digital:');
    console.log(`   ID: ${orden.id}`);
    console.log(`   Número: ${orden.numero_orden}`);
    console.log(`   Cliente: ${orden.nombre_cliente}`);
    console.log(`   Fecha: ${orden.created_at}\n`);

    // Verificar detalle digital
    const detalleResult = await client.query(`
      SELECT * FROM detalle_orden_trabajo_digital
      WHERE orden_trabajo_id = $1
    `, [orden.id]);

    if (detalleResult.rows.length > 0) {
      console.log('✅ Detalle digital encontrado:');
      const detalle = detalleResult.rows[0];
      console.log(`   Adherencia: ${detalle.adherencia || '(vacío)'}`);
      console.log(`   Troquel: ${detalle.troquel || '(vacío)'}`);
      console.log(`   Lote Material: ${detalle.lote_material || '(vacío)'}`);
      console.log(`   Tipo Impresión: ${detalle.tipo_impresion || '(vacío)'}\n`);
    } else {
      console.log('❌ No hay detalle digital para esta orden\n');
    }

    // Verificar productos
    const productosResult = await client.query(`
      SELECT * FROM productos_orden_digital
      WHERE orden_trabajo_id = $1
      ORDER BY orden ASC
    `, [orden.id]);

    console.log(`📦 Productos digitales: ${productosResult.rows.length} productos encontrados\n`);
    
    if (productosResult.rows.length > 0) {
      productosResult.rows.forEach((prod, index) => {
        console.log(`   Producto ${index + 1}:`);
        console.log(`      Cantidad: ${prod.cantidad || '(vacío)'}`);
        console.log(`      Cod MG: ${prod.cod_mg || '(vacío)'}`);
        console.log(`      Cod Cliente: ${prod.cod_cliente || '(vacío)'}`);
        console.log(`      Producto: ${prod.producto || '(vacío)'}`);
        console.log(`      Medidas: ${prod.medida_ancho || '?'} x ${prod.medida_alto || '?'} mm`);
        console.log(`      Avance: ${prod.avance || '(vacío)'}`);
        console.log(`      Metros Impresos: ${prod.metros_impresos || '(vacío)'}\n`);
      });
    } else {
      console.log('   ⚠️  No se encontraron productos para esta orden');
      console.log('   Esto significa que el array de productos estaba vacío al guardar');
      console.log('   Asegúrate de agregar productos con el botón "+ Agregar Producto"\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verificarProductos();
