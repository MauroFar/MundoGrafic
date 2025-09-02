import express from "express";
import { Request, Response } from "express";
import db from "../db/knex";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
// import puppeteer from "puppeteer";

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../storage/uploads");
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

const upload = multer({ storage });

// Ruta para subir archivos
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo" });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    };

    res.json({
      message: "Archivo subido exitosamente",
      file: fileInfo
    });
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para descargar archivos
router.get("/download/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../../storage/uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error descargando archivo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para listar archivos
router.get("/files", async (req: Request, res: Response) => {
  try {
    const uploadDir = path.join(__dirname, "../../storage/uploads");
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    res.json({ files });
  } catch (error) {
    console.error("Error listando archivos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para eliminar archivos
router.delete("/files/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../../storage/uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    fs.unlinkSync(filePath);
    res.json({ message: "Archivo eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para generar PDF (TEMPORALMENTE COMENTADO)
router.post("/generate-pdf", async (req: Request, res: Response) => {
  try {
    const { html, filename } = req.body;

    if (!html) {
      return res.status(400).json({ error: "HTML requerido" });
    }

    // TEMPORALMENTE COMENTADO - Generar PDF usando Puppeteer
    // const browser = await puppeteer.launch({
    //   headless: "new",
    //   args: ['--no-sandbox', '--disable-setuid-sandbox']
    // });
    
    // Por ahora, retornar mensaje de funcionalidad deshabilitada
    res.json({
      message: "Generación de PDF temporalmente deshabilitada",
      html: html.substring(0, 100) + "...",
      filename: filename || "documento.pdf"
    });

  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
