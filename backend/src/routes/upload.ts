import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import imageOptimizer from "../services/imageOptimizer";

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();

// Filtrar archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // límite de 10MB
  }
});

// Ruta para subir una imagen
router.post('/imagen', upload.single('imagen'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    // Optimizar la imagen
    const optimizedImage = await imageOptimizer.optimizeImage(req.file);

    res.json({ 
      success: true, 
      imagenRuta: optimizedImage.webp, // Usar WebP como formato principal
      imagenRutaJpeg: optimizedImage.jpeg, // JPEG como fallback
      thumbnail: optimizedImage.thumbnail,
      metadata: {
        originalName: optimizedImage.originalName,
        size: optimizedImage.size,
        width: optimizedImage.width,
        height: optimizedImage.height
      },
      mensaje: 'Imagen optimizada y subida correctamente' 
    });
  } catch (error: any) {
    console.error('Error al procesar la imagen:', error);
    res.status(500).json({ 
      error: 'Error al procesar la imagen',
      mensaje: error.message 
    });
  }
});

// Ruta para eliminar una imagen
router.delete('/imagen', async (req: any, res: any) => {
  try {
    const { imagenRuta } = req.body;
    if (!imagenRuta) {
      return res.status(400).json({ error: 'Se requiere la ruta de la imagen' });
    }

    await imageOptimizer.deleteImage(imagenRuta);
    res.json({ 
      success: true, 
      mensaje: 'Imagen eliminada correctamente' 
    });
  } catch (error: any) {
    console.error('Error al eliminar la imagen:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la imagen',
      mensaje: error.message 
    });
  }
});

// Ruta para servir archivos estáticos
router.use('/uploads', express.static(path.join(__dirname, '../../storage/uploads')));

export default router; 