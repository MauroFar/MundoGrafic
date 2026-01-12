require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432')
});

async function checkDuplicateData() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Verificar datos en los campos duplicados
    const result = await client.query(`
      SELECT 
        id,
        nombre_cliente,
        telefono_cliente,
        telefono,
        direccion_cliente,
        direccion,
        email_cliente,
        CASE 
          WHEN telefono_cliente IS NOT NULL AND telefono IS NOT NULL AND telefono_cliente != telefono THEN 'CONFLICTO'
          WHEN telefono_cliente IS NOT NULL AND telefono IS NULL THEN 'Solo _cliente'
          WHEN telefono_cliente IS NULL AND telefono IS NOT NULL THEN 'Solo sin sufijo'
          WHEN telefono_cliente IS NULL AND telefono IS NULL THEN 'Ambos NULL'
          ELSE 'Iguales'
        END as estado_telefono,
        CASE 
          WHEN direccion_cliente IS NOT NULL AND direccion IS NOT NULL AND direccion_cliente != direccion THEN 'CONFLICTO'
          WHEN direccion_cliente IS NOT NULL AND direccion IS NULL THEN 'Solo _cliente'
          WHEN direccion_cliente IS NULL AND direccion IS NOT NULL THEN 'Solo sin sufijo'
          WHEN direccion_cliente IS NULL AND direccion IS NULL THEN 'Ambos NULL'
          ELSE 'Iguales'
        END as estado_direccion
      FROM clientes
      ORDER BY id
      LIMIT 50;
    `);

    console.log(`=== ANÁLISIS DE DATOS DUPLICADOS (${result.rows.length} registros) ===\n`);

    // Estadísticas de teléfono
    const statsQuery = await client.query(`
      SELECT 
        COUNT(*) as total_clientes,
        COUNT(telefono_cliente) as con_telefono_cliente,
        COUNT(telefono) as con_telefono,
        COUNT(CASE WHEN telefono_cliente IS NOT NULL AND telefono IS NOT NULL THEN 1 END) as ambos_telefono,
        COUNT(CASE WHEN telefono_cliente IS NOT NULL AND telefono IS NOT NULL AND telefono_cliente != telefono THEN 1 END) as conflictos_telefono,
        COUNT(direccion_cliente) as con_direccion_cliente,
        COUNT(direccion) as con_direccion,
        COUNT(CASE WHEN direccion_cliente IS NOT NULL AND direccion IS NOT NULL THEN 1 END) as ambos_direccion,
        COUNT(CASE WHEN direccion_cliente IS NOT NULL AND direccion IS NOT NULL AND direccion_cliente != direccion THEN 1 END) as conflictos_direccion
      FROM clientes;
    `);

    const stats = statsQuery.rows[0];
    console.log('📊 ESTADÍSTICAS:');
    console.log(`   Total clientes: ${stats.total_clientes}`);
    console.log('\n   TELÉFONO:');
    console.log(`   - Con telefono_cliente: ${stats.con_telefono_cliente}`);
    console.log(`   - Con telefono (sin sufijo): ${stats.con_telefono}`);
    console.log(`   - Con ambos campos llenos: ${stats.ambos_telefono}`);
    console.log(`   - CONFLICTOS (datos diferentes): ${stats.conflictos_telefono}`);
    console.log('\n   DIRECCIÓN:');
    console.log(`   - Con direccion_cliente: ${stats.con_direccion_cliente}`);
    console.log(`   - Con direccion (sin sufijo): ${stats.con_direccion}`);
    console.log(`   - Con ambos campos llenos: ${stats.ambos_direccion}`);
    console.log(`   - CONFLICTOS (datos diferentes): ${stats.conflictos_direccion}`);

    // Mostrar conflictos si existen
    if (stats.conflictos_telefono > 0 || stats.conflictos_direccion > 0) {
      console.log('\n⚠️  SE ENCONTRARON CONFLICTOS:\n');
      
      result.rows.forEach((row, index) => {
        if (row.estado_telefono === 'CONFLICTO' || row.estado_direccion === 'CONFLICTO') {
          console.log(`Cliente #${row.id} - ${row.nombre_cliente}`);
          if (row.estado_telefono === 'CONFLICTO') {
            console.log(`   TELÉFONO:`);
            console.log(`   - telefono_cliente: "${row.telefono_cliente}"`);
            console.log(`   - telefono: "${row.telefono}"`);
          }
          if (row.estado_direccion === 'CONFLICTO') {
            console.log(`   DIRECCIÓN:`);
            console.log(`   - direccion_cliente: "${row.direccion_cliente}"`);
            console.log(`   - direccion: "${row.direccion}"`);
          }
          console.log('');
        }
      });
    }

    console.log('\n✅ RECOMENDACIÓN:');
    console.log('   - Eliminar columnas: telefono, direccion (sin sufijo _cliente)');
    console.log('   - Mantener: telefono_cliente, direccion_cliente');
    console.log('   - Tu código ya está usando correctamente los campos con sufijo _cliente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDuplicateData();
