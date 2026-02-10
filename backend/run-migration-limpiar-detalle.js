const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function runCleanup() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // ADVERTENCIA
    console.log('\n⚠️  ADVERTENCIA: Este script eliminará columnas de detalle_orden_trabajo');
    console.log('   Asegúrate de que:');
    console.log('   1. La migración anterior fue exitosa');
    console.log('   2. Has verificado que los datos están en las nuevas tablas');
    console.log('   3. El sistema funciona correctamente con las nuevas tablas');
    console.log('');
    const answer = await askQuestion('¿Deseas continuar con la limpieza? (escribe "SI" para confirmar): ');

    if (answer.toUpperCase() !== 'SI') {
      console.log('❌ Operación cancelada por el usuario');
      process.exit(0);
    }

    console.log('\n🧹 Ejecutando limpieza de campos redundantes...');
    const sqlLimpiar = fs.readFileSync(
      path.join(__dirname, 'migrations', 'limpiar-detalle-orden-trabajo.sql'),
      'utf8'
    );
    await client.query(sqlLimpiar);
    
    console.log('✅ Limpieza completada exitosamente');
    console.log('\n📝 detalle_orden_trabajo ahora solo contiene campos comunes:');
    console.log('   - material');
    console.log('   - impresion');
    console.log('   - observaciones');
    console.log('   - numero_salida');
    console.log('   - prensa_seleccionada');

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runCleanup()
  .then(() => {
    console.log('\n✅ Proceso de limpieza completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en la limpieza:', error.message);
    process.exit(1);
  });
