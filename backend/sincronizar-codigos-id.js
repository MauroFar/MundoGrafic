const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function sincronizarCodigosConID() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Actualizar códigos existentes para que coincidan con el ID
    console.log('🔄 Sincronizando códigos con IDs...');
    
    const clientes = await client.query('SELECT id FROM clientes ORDER BY id ASC');
    
    for (const cliente of clientes.rows) {
      const codigo = `CL${String(cliente.id).padStart(5, '0')}`;
      await client.query(
        'UPDATE clientes SET codigo_cliente = $1 WHERE id = $2',
        [codigo, cliente.id]
      );
      console.log(`   ✓ ID ${cliente.id} → ${codigo}`);
    }

    console.log('\n✅ Códigos sincronizados con IDs');

    // 2. Eliminar la función anterior y crear una nueva basada en ID
    console.log('\n🔧 Eliminando función anterior...');
    await client.query('DROP FUNCTION IF EXISTS generar_codigo_cliente()');
    console.log('✅ Función anterior eliminada');

    // 3. Verificar el resultado
    console.log('\n📊 Clientes actualizados:');
    const result = await client.query(`
      SELECT id, codigo_cliente, nombre_cliente, empresa_cliente
      FROM clientes
      ORDER BY id ASC
    `);
    
    console.table(result.rows);

    console.log('\n🎉 Sincronización completada!');
    console.log('💡 Ahora el código de cliente coincide con su ID:');
    console.log('   ID 1 = CL00001');
    console.log('   ID 5 = CL00005');
    console.log('   ID 100 = CL00100');

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

sincronizarCodigosConID();
