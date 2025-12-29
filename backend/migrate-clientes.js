const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function migrate() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Verificando columnas existentes...');
    
    // Verificar qué columnas existen
    const existingColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clientes'
    `);
    
    const columnNames = existingColumns.rows.map(row => row.column_name);
    console.log('Columnas existentes:', columnNames);

    // Agregar columnas faltantes
    console.log('\n🔧 Agregando columnas faltantes...\n');

    // 1. Agregar empresa_cliente si no existe
    if (!columnNames.includes('empresa_cliente')) {
      await client.query(`
        ALTER TABLE clientes 
        ADD COLUMN empresa_cliente VARCHAR(255)
      `);
      console.log('✅ Columna empresa_cliente agregada');
    } else {
      console.log('⏭️  Columna empresa_cliente ya existe');
    }

    // 2. Agregar nit_cliente si no existe
    if (!columnNames.includes('nit_cliente')) {
      await client.query(`
        ALTER TABLE clientes 
        ADD COLUMN nit_cliente VARCHAR(50)
      `);
      console.log('✅ Columna nit_cliente agregada');
    } else {
      console.log('⏭️  Columna nit_cliente ya existe');
    }

    // 3. Agregar estado_cliente si no existe
    if (!columnNames.includes('estado_cliente')) {
      await client.query(`
        ALTER TABLE clientes 
        ADD COLUMN estado_cliente VARCHAR(20) DEFAULT 'activo'
      `);
      console.log('✅ Columna estado_cliente agregada');
    } else {
      console.log('⏭️  Columna estado_cliente ya existe');
    }

    // 4. Agregar notas_cliente si no existe
    if (!columnNames.includes('notas_cliente')) {
      await client.query(`
        ALTER TABLE clientes 
        ADD COLUMN notas_cliente TEXT
      `);
      console.log('✅ Columna notas_cliente agregada');
    } else {
      console.log('⏭️  Columna notas_cliente ya existe');
    }

    // 5. Agregar fecha_registro si no existe
    if (!columnNames.includes('fecha_registro')) {
      await client.query(`
        ALTER TABLE clientes 
        ADD COLUMN fecha_registro TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ Columna fecha_registro agregada');
    } else {
      console.log('⏭️  Columna fecha_registro ya existe');
    }

    // 6. Agregar created_at si no existe
    if (!columnNames.includes('created_at')) {
      await client.query(`
        ALTER TABLE clientes 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ Columna created_at agregada');
    } else {
      console.log('⏭️  Columna created_at ya existe');
    }

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('\n📋 Estructura actualizada de la tabla:');
    
    const updatedStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      ORDER BY ordinal_position;
    `);
    
    console.table(updatedStructure.rows);

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

migrate();
