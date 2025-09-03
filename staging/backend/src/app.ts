import express from "express";
import cors from "cors";
import path from "path";

const app = express();

// Habilitar CORS
app.use(cors());

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