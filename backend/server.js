const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://192.168.130.192'
    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Aplicar CORS antes de cualquier otra ruta
app.use(cors(corsOptions));

// Middleware para manejar preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Importar rutas
const cotizacionesRoutes = require('./routes/cotizaciones');
const clientesRoutes = require('./routes/clientes');
const productosRoutes = require('./routes/productos');
const usuariosRoutes = require('./routes/usuarios');

// Usar rutas
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 