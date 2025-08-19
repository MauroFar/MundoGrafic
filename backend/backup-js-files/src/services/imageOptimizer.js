const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageOptimizer {
  constructor() {
    this.maxWidth = 1920; // Ancho máximo para imágenes grandes
    this.maxHeight = 1080; // Alto máximo para imágenes grandes
    this.quality = 80; // Calidad de compresión (0-100)
    this.thumbnailWidth = 400; // Ancho para miniaturas
    this.thumbnailHeight = 300; // Alto para miniaturas
  }

  async optimizeImage(file) {
    try {
      // Validar el tipo de archivo
      if (!file.mimetype.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validar el tamaño del archivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 10MB');
      }

      // Generar nombres de archivo únicos
      const timestamp = Date.now();
      const originalName = path.parse(file.originalname).name;
      const webpFilename = `${originalName}-${timestamp}.webp`;
      const jpegFilename = `${originalName}-${timestamp}.jpg`;
      const thumbnailFilename = `${originalName}-${timestamp}-thumb.webp`;

      // Crear directorios si no existen
      const uploadDir = path.join(__dirname, '../../storage/uploads');
      const thumbnailsDir = path.join(uploadDir, 'thumbnails');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.mkdir(thumbnailsDir, { recursive: true });

      // Procesar la imagen original
      const image = sharp(file.buffer);

      // Obtener metadatos de la imagen
      const metadata = await image.metadata();

      // Redimensionar si es necesario
      if (metadata.width > this.maxWidth || metadata.height > this.maxHeight) {
        image.resize(this.maxWidth, this.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Optimizar y guardar en formato WebP
      await image
        .webp({ quality: this.quality })
        .toFile(path.join(uploadDir, webpFilename));

      // Crear versión JPEG como fallback
      await image
        .jpeg({ quality: this.quality })
        .toFile(path.join(uploadDir, jpegFilename));

      // Crear miniatura
      await image
        .resize(this.thumbnailWidth, this.thumbnailHeight, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: this.quality })
        .toFile(path.join(thumbnailsDir, thumbnailFilename));

      return {
        webp: `/storage/uploads/${webpFilename}`,
        jpeg: `/storage/uploads/${jpegFilename}`,
        thumbnail: `/storage/uploads/thumbnails/${thumbnailFilename}`,
        originalName: file.originalname,
        size: file.size,
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('Error al optimizar la imagen:', error);
      throw error;
    }
  }

  async deleteImage(imagePath) {
    try {
      const fullPath = path.join(__dirname, '../../storage', imagePath);
      await fs.unlink(fullPath);

      // También eliminar la miniatura si existe
      const thumbnailPath = imagePath.replace('/uploads/', '/uploads/thumbnails/');
      const fullThumbnailPath = path.join(__dirname, '../../storage', thumbnailPath);
      try {
        await fs.unlink(fullThumbnailPath);
      } catch (error) {
        // Ignorar error si la miniatura no existe
      }
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      throw error;
    }
  }
}

module.exports = new ImageOptimizer(); 