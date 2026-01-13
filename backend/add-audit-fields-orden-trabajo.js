const { Client } = require('pg');

require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mundografic',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function addAuditFields() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Verificar si los campos ya existen
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orden_trabajo' 
      AND column_name IN ('created_by', 'updated_by', 'created_at', 'updated_at')
    `;
    
    const checkResult = await client.query(checkQuery);
    const existingColumns = checkResult.rows.map(row => row.column_name);
    
    console.log('📋 Columnas de auditoría existentes:', existingColumns);

    // Añadir campos faltantes
    if (!existingColumns.includes('created_by')) {
      await client.query(`
        ALTER TABLE orden_trabajo 
        ADD COLUMN created_by INTEGER REFERENCES usuarios(id)
      `);
      console.log('✅ Campo created_by agregado');
    } else {
      console.log('ℹ️  Campo created_by ya existe');
    }

    if (!existingColumns.includes('updated_by')) {
      await client.query(`
        ALTER TABLE orden_trabajo 
        ADD COLUMN updated_by INTEGER REFERENCES usuarios(id)
      `);
      console.log('✅ Campo updated_by agregado');
    } else {
      console.log('ℹ️  Campo updated_by ya existe');
    }

    if (!existingColumns.includes('created_at')) {
      await client.query(`
        ALTER TABLE orden_trabajo 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ Campo created_at agregado');
    } else {
      console.log('ℹ️  Campo created_at ya existe');
    }

    if (!existingColumns.includes('updated_at')) {
      await client.query(`
        ALTER TABLE orden_trabajo 
        ADD COLUMN updated_at TIMESTAMP
      `);
      console.log('✅ Campo updated_at agregado');
    } else {
      console.log('ℹ️  Campo updated_at ya existe');
    }

    console.log('✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addAuditFields();
