import express from "express";
import { Request, Response } from "express";
import db from "../db/knex";
import multer from "multer";
// import sharp from "sharp";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configuración de multer para subida de firmas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../storage/firmas");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Permitir solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Obtener todas las firmas
router.get("/", async (req: Request, res: Response) => {
  try {
    const firmas = await db("firmas")
      .select("*")
      .orderBy("fecha_creacion", "desc");
    res.json(firmas);
  } catch (error) {
    console.error("Error obteniendo firmas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener firma por ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const firma = await db("firmas")
      .where("id", id)
      .first();

    if (!firma) {
      return res.status(404).json({ error: "Firma no encontrada" });
    }

    res.json(firma);
  } catch (error) {
    console.error("Error obteniendo firma:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Subir nueva firma
router.post("/", upload.single("firma"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo de firma" });
    }

    const { nombre, descripcion, usuario_id } = req.body;

    // TEMPORALMENTE COMENTADO - Optimizar imagen con Sharp
    // await sharp(originalPath)
    //   .resize(300, 200, { fit: 'inside' })
    //   .jpeg({ quality: 80 })
    //   .toFile(optimizedPath);
    
    // Por ahora, usar el archivo original sin optimizar
    const firmaData = {
      nombre,
      descripcion,
      archivo_original: req.file.filename,
      archivo_optimizado: req.file.filename, // Temporalmente igual al original
      mimetype: req.file.mimetype,
      tamaño: req.file.size,
      usuario_id: usuario_id || null,
      fecha_creacion: new Date()
    };

    const [firmaId] = await db("firmas").insert(firmaData);

    res.status(201).json({
      id: firmaId,
      message: "Firma subida exitosamente",
      firma: firmaData
    });
  } catch (error) {
    console.error("Error subiendo firma:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar firma
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    await db("firmas")
      .where("id", id)
      .update({
        nombre,
        descripcion,
        fecha_actualizacion: new Date()
      });

    res.json({ message: "Firma actualizada exitosamente" });
  } catch (error) {
    console.error("Error actualizando firma:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar firma
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Obtener información de la firma antes de eliminar
    const firma = await db("firmas")
      .where("id", id)
      .first();

    if (!firma) {
      return res.status(404).json({ error: "Firma no encontrada" });
    }

    // Eliminar archivos físicos
    const firmasDir = path.join(__dirname, "../../storage/firmas");
    
    if (firma.archivo_original) {
      const originalPath = path.join(firmasDir, firma.archivo_original);
      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }
    }

    if (firma.archivo_optimizado && firma.archivo_optimizado !== firma.archivo_original) {
      const optimizedPath = path.join(firmasDir, firma.archivo_optimizado);
      if (fs.existsSync(optimizedPath)) {
        fs.unlinkSync(optimizedPath);
      }
    }

    // Eliminar registro de la base de datos
    await db("firmas")
      .where("id", id)
      .del();

    res.json({ message: "Firma eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando firma:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Descargar firma
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const firma = await db("firmas")
      .where("id", id)
      .first();

    if (!firma) {
      return res.status(404).json({ error: "Firma no encontrada" });
    }

    const filePath = path.join(__dirname, "../../storage/firmas", firma.archivo_original);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo de firma no encontrado" });
    }

    res.download(filePath, firma.nombre || "firma");
  } catch (error) {
    console.error("Error descargando firma:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
