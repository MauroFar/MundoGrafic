import express from "express";
import cors from "cors";
import path from "path";

const app = express();

// Configurar CORS dinámicamente para desarrollo y producción
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir solicitudes sin origin (como Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Permitir todos los orígenes de localhost (cualquier puerto)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Permitir IPs de la red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (origin.match(/^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Si hay una variable de entorno con orígenes permitidos adicionales
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // En desarrollo, permitir todo
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Rechazar otros orígenes
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));

// Middleware para parsear JSON con límite aumentado para firmas con imágenes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configurar el middleware para servir archivos estáticos
app.use('/storage/pdfs', express.static(path.join(__dirname, '../storage/pdfs')));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Servir archivos estáticos de la carpeta 'email-signature'
app.use('/email-signature', express.static(path.join(__dirname, '../public/email-signature')));

// Middleware específico para rutas de firmas (aumentar límite)
app.use('/api/usuarios/:id/firma', express.json({ limit: '50mb' }));

// Importar y usar rutas de firmas
import firmasRouter from './routes/firmas';
app.use('/api/firmas', firmasRouter);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app; 