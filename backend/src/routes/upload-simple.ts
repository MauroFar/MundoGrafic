import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const router = express.Router();

// Configurar multer para almacenamiento de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Crear directorio de uploads si no existe
      const uploadDir = path.join(process.cwd(), 'storage', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `cotizacion-${uniqueSuffix}${extension}`);
  }
});

// Filtro de archivos
const fileFilter = (req: any, file: any, cb: any) => {
  // Solo permitir imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
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

    // Generar rutas para la imagen
    const imagenRuta = `/uploads/${req.file.filename}`;
    const imagenRutaJpeg = `/uploads/${path.parse(req.file.filename).name}.jpeg`;

    // Respuesta exitosa
    res.json({ 
      success: true, 
      imagenRuta: imagenRuta,
      imagenRutaJpeg: imagenRutaJpeg,
      mensaje: 'Imagen subida exitosamente'
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
      return res.status(400).json({ error: 'Ruta de imagen no proporcionada' });
    }

    // Construir ruta completa del archivo
    const filePath = path.join(process.cwd(), 'storage', imagenRuta.replace('/uploads/', ''));
    
    try {
      await fs.unlink(filePath);
      res.json({ success: true, mensaje: 'Imagen eliminada exitosamente' });
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        // El archivo no existe, pero lo consideramos exitoso
        res.json({ success: true, mensaje: 'Imagen no encontrada, pero eliminada del registro' });
      } else {
        throw fileError;
      }
    }
  } catch (error: any) {
    console.error('Error al eliminar la imagen:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la imagen',
      mensaje: error.message 
    });
  }
});

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Upload funcionando correctamente' });
});

export default router;
