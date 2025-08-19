const { Client } = require('pg');

console.log('🚀 Iniciando prueba de conexión a base de datos...');

// Configuración directa (sin .env)
const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'sistema_mg',
    password: '2024Asdaspro@',
    port: 5432,
};

console.log('📋 Configuración de conexión:');
console.log(`   Host: ${config.host}`);
console.log(`   Puerto: ${config.port}`);
console.log(`   Base de datos: ${config.database}`);
console.log(`   Usuario: ${config.user}`);

async function testConnection() {
    const client = new Client(config);
    
    try {
        console.log('🔌 Intentando conectar a PostgreSQL...');
        await client.connect();
        console.log('✅ Conexión exitosa a PostgreSQL!');
        
        // Probar consulta simple
        console.log('🧪 Probando consulta simple...');
        const result = await client.query('SELECT version()');
        console.log('📊 Versión de PostgreSQL:', result.rows[0].version);
        
        // Probar consulta a tabla específica
        console.log('🧪 Probando consulta a tabla usuarios...');
        const userResult = await client.query('SELECT COUNT(*) as total FROM usuarios');
        console.log('👥 Total de usuarios:', userResult.rows[0].total);
        
        console.log('🎉 Todas las pruebas pasaron exitosamente!');
        
    } catch (error) {
        console.error('❌ Error durante la prueba:');
        console.error('   Tipo de error:', error.constructor.name);
        console.error('   Mensaje:', error.message);
        if (error.stack) {
            console.error('   Stack:', error.stack);
        }
    } finally {
        await client.end();
        console.log('🔌 Conexión cerrada.');
    }
}

// Ejecutar la prueba
testConnection().catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});

console.log('⏳ Ejecutando prueba...');
