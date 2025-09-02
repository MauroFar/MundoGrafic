import express from "express";
import authRequired from "../middleware/auth";
import path from "path";
import fs from "fs/promises";
import multer from "multer";
// import sharp from "sharp"; // TEMPORALMENTE COMENTADO - CAUSA ERROR

const router = express.Router();

// Configurar multer para subir archivos de firma
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = req.params.userId || req.body.usuario_id;
    const uploadPath = path.join(__dirname, `../../storage/firmas/${userId}`);
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err, uploadPath);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `firma_${timestamp}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por imagen
    files: 10 // Máximo 10 imágenes por firma
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Subir imagen de firma (VERSIÓN SIMPLIFICADA - SIN OPTIMIZACIÓN)
router.post('/upload/:userId', authRequired(['admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const userId = req.params.userId;
    const originalPath = req.file.path;
    
    // TEMPORALMENTE: No optimizamos la imagen, usamos la original
    // const optimizedPath = originalPath.replace(/\.[^/.]+$/, '_optimized.jpg');
    
    // await sharp(originalPath)
    //   .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    //   .jpeg({ quality: 80, progressive: true })
    //   .toFile(optimizedPath);
    
    // await fs.unlink(originalPath);

    // Generar URL pública (usando archivo original)
    const publicUrl = `/api/firmas/images/${userId}/${path.basename(originalPath)}`;

    res.json({
      success: true,
      url: publicUrl,
      filename: path.basename(originalPath),
      note: 'Imagen sin optimizar temporalmente'
    });

  } catch (error) {
    console.error('Error al procesar imagen:', error);
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

// Servir imágenes de firmas
router.get('/images/:userId/:filename', (req, res) => {
  const { userId, filename } = req.params;
  const imagePath = path.join(__dirname, `../../storage/firmas/${userId}/${filename}`);
  
  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Imagen no encontrada' });
    }
  });
});

// Eliminar imagen de firma
router.delete('/images/:userId/:filename', authRequired(['admin']), async (req, res) => {
  try {
    const { userId, filename } = req.params;
    const imagePath = path.join(__dirname, `../../storage/firmas/${userId}/${filename}`);
    
    await fs.unlink(imagePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
});

// Obtener lista de imágenes de un usuario
router.get('/images/:userId', authRequired(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const userPath = path.join(__dirname, `../../storage/firmas/${userId}`);
    
    const files = await fs.readdir(userPath);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `/api/firmas/images/${userId}/${file}`,
        size: fs.stat(path.join(userPath, file)).then(stat => stat.size)
      }));

    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las imágenes' });
  }
});

export default router;
