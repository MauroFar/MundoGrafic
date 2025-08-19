const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Habilitar CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Configurar el middleware para servir archivos estáticos
app.use('/storage/pdfs', express.static(path.join(__dirname, '../storage/pdfs')));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Servir archivos estáticos de la carpeta 'email-signature'
app.use('/email-signature', express.static(path.join(__dirname, '../public/email-signature')));

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app; 