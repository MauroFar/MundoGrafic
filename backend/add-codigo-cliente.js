const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function addCodigoCliente() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Agregar columna codigo_cliente si no existe
    console.log('📋 Agregando columna codigo_cliente...');
    await client.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS codigo_cliente VARCHAR(20) UNIQUE
    `);
    console.log('✅ Columna codigo_cliente agregada\n');

    // 2. Generar códigos para clientes existentes que no tengan
    console.log('🔄 Generando códigos para clientes existentes...');
    
    const clientesSinCodigo = await client.query(`
      SELECT id FROM clientes 
      WHERE codigo_cliente IS NULL 
      ORDER BY id ASC
    `);

    if (clientesSinCodigo.rows.length > 0) {
      console.log(`   Encontrados ${clientesSinCodigo.rows.length} clientes sin código`);
      
      for (let i = 0; i < clientesSinCodigo.rows.length; i++) {
        const clienteId = clientesSinCodigo.rows[i].id;
        const codigo = `CL${String(i + 1).padStart(5, '0')}`; // CL00001, CL00002, etc.
        
        await client.query(
          'UPDATE clientes SET codigo_cliente = $1 WHERE id = $2',
          [codigo, clienteId]
        );
        console.log(`   ✓ Cliente ID ${clienteId} → ${codigo}`);
      }
    } else {
      console.log('   No hay clientes sin código');
    }

    // 3. Crear función para generar el siguiente código automáticamente
    console.log('\n🔧 Creando función para generar códigos automáticos...');
    await client.query(`
      CREATE OR REPLACE FUNCTION generar_codigo_cliente()
      RETURNS TEXT AS $$
      DECLARE
        ultimo_numero INTEGER;
        nuevo_codigo TEXT;
      BEGIN
        -- Obtener el último número usado
        SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_cliente FROM 3) AS INTEGER)), 0)
        INTO ultimo_numero
        FROM clientes
        WHERE codigo_cliente ~ '^CL[0-9]+$';
        
        -- Generar el nuevo código
        nuevo_codigo := 'CL' || LPAD((ultimo_numero + 1)::TEXT, 5, '0');
        
        RETURN nuevo_codigo;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Función generar_codigo_cliente() creada\n');

    // 4. Verificar el resultado
    console.log('📊 Verificando clientes con códigos:');
    const result = await client.query(`
      SELECT id, codigo_cliente, nombre_cliente, empresa_cliente
      FROM clientes
      ORDER BY id ASC
      LIMIT 10
    `);
    
    console.table(result.rows);

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('💡 Ahora todos los clientes tienen un código único (CL00001, CL00002, etc.)');
    console.log('💡 Los nuevos clientes recibirán automáticamente un código al crearse');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addCodigoCliente();
