import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import path from "path";
import fs from "fs/promises";
import multer from "multer";

/**
 * Firmas — infraestructura de archivos (subida/servido/borrado de imágenes).
 * No tiene lógica de dominio: opera sobre el sistema de archivos directamente.
 */
export const createFirmasRoutes = (_client: Client) => {
  const router = Router();

  // ── Multer ──────────────────────────────────────────────────────────────────
  const storage = multer.diskStorage({
    destination: async (req, _file, cb) => {
      const userId = req.params.userId || req.body.usuario_id;
      const uploadPath = path.join(__dirname, `../../../../storage/firmas/${userId}`);
      try {
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } catch (err: any) {
        cb(err, uploadPath);
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `firma_${Date.now()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) return cb(null, true);
      cb(new Error("Solo se permiten archivos de imagen"));
    },
  });

  // ── Subir imagen ────────────────────────────────────────────────────────────
  router.post("/upload/:userId", authRequired(), upload.single("image"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });
      const publicUrl = `/api/firmas/images/${req.params.userId}/${path.basename(req.file.path)}`;
      res.json({ success: true, url: publicUrl, filename: path.basename(req.file.path) });
    } catch (err: any) {
      console.error("Error al procesar imagen de firma:", err);
      res.status(500).json({ error: "Error al procesar la imagen" });
    }
  });

  // ── Servir imagen ───────────────────────────────────────────────────────────
  router.get("/images/:userId/:filename", (req: any, res: any) => {
    const { userId, filename } = req.params;
    const imagePath = path.join(__dirname, `../../../../storage/firmas/${userId}/${filename}`);
    res.sendFile(imagePath, (err: any) => {
      if (err) res.status(404).json({ error: "Imagen no encontrada" });
    });
  });

  // ── Listar imágenes de un usuario ───────────────────────────────────────────
  router.get("/images/:userId", authRequired(), async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const userPath = path.join(__dirname, `../../../../storage/firmas/${userId}`);
      const files = await fs.readdir(userPath).catch(() => [] as string[]);
      const images = files
        .filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f))
        .map(f => ({
          filename: f,
          url: `/api/firmas/images/${userId}/${f}`,
        }));
      res.json(images);
    } catch (err: any) {
      res.status(500).json({ error: "Error al obtener las imágenes" });
    }
  });

  // ── Eliminar imagen ─────────────────────────────────────────────────────────
  router.delete("/images/:userId/:filename", authRequired(), async (req: any, res: any) => {
    try {
      const { userId, filename } = req.params;
      const imagePath = path.join(__dirname, `../../../../storage/firmas/${userId}/${filename}`);
      await fs.unlink(imagePath);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Error al eliminar la imagen" });
    }
  });

  return router;
};
