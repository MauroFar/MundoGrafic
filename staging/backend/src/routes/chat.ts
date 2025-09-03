import express, { Request, Response } from "express";
import authRequired from "../middleware/auth";

export default (client: any) => {
  const router = express.Router();

  // Listar usuarios para el chat (acceso para cualquier usuario autenticado)
  router.get("/usuarios", authRequired(), async (req: Request, res: Response) => {
    try {
      const result = await client.query(
        `SELECT id, nombre, email, nombre_usuario, rol FROM usuarios WHERE activo = true`
      );
      // En el futuro puedes agregar avatar, estado, etc.
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: "Error al obtener los usuarios del chat" });
    }
  });

  return router;
}; 