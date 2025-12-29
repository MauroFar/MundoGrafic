const { Client } = require('pg');
require('dotenv').config();

async function actualizarCodigosCotizacion() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sistema_mg',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Actualizar todos los códigos de cotización basándose en el ID
    console.log('🔄 Actualizando códigos de cotización...');
    
    const updateQuery = `
      UPDATE cotizaciones 
      SET codigo_cotizacion = 'CO' || LPAD(id::TEXT, 5, '0')
      WHERE codigo_cotizacion IS NULL 
         OR codigo_cotizacion != ('CO' || LPAD(id::TEXT, 5, '0'))
    `;
    
    const result = await client.query(updateQuery);
    
    console.log(`✅ ${result.rowCount} cotizaciones actualizadas`);
    
    // Mostrar algunos ejemplos
    const ejemplos = await client.query(`
      SELECT id, codigo_cotizacion, numero_cotizacion 
      FROM cotizaciones 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('\n📋 Ejemplos de códigos actualizados:');
    ejemplos.rows.forEach(row => {
      console.log(`   ID: ${row.id} → Código: ${row.codigo_cotizacion} (Nº Cotización: ${row.numero_cotizacion})`);
    });
    
    console.log('\n✅ Actualización completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

actualizarCodigosCotizacion();
