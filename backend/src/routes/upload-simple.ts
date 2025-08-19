import express from "express";
const router = express.Router();

// Ruta de prueba simple
router.get('/test', (req, res) => {
  res.json({ message: 'Upload simple funcionando' });
});

// Ruta básica sin multer
router.post('/imagen-simple', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Ruta de imagen simple (sin multer)' 
  });
});

export default router;
