import express from 'express';
import cors from 'cors';
import { Client } from 'pg';

const app = express();
const port = 3000;

// Middleware básico
app.use(cors());
app.use(express.json());

// Configuración de BD
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'sistema_mg',
    password: '2024Asdaspro@',
    port: 5432,
};

// Ruta de prueba simple
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor mínimo funcionando!' });
});

// Ruta de prueba de BD
app.get('/db-test', async (req, res) => {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        const result = await client.query('SELECT COUNT(*) as total FROM usuarios');
        await client.end();
        
        res.json({ 
            message: 'Conexión BD exitosa', 
            totalUsuarios: result.rows[0].total 
        });
    } catch (error: any) {
        await client.end();
        res.status(500).json({ 
            error: 'Error en BD', 
            message: error.message 
        });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor mínimo iniciado en puerto ${port}`);
    console.log(`📱 Prueba: http://localhost:${port}/test`);
    console.log(`🗄️ Prueba BD: http://localhost:${port}/db-test`);
});

console.log('⏳ Iniciando servidor mínimo...');
