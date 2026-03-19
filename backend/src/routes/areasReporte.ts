import express from "express";
import authRequired from "../middleware/auth";

export default (client: any) => {
  const router = express.Router();

  // GET /api/areasReporte - listar todas las áreas activas
  router.get("/", authRequired(), async (req: any, res: any) => {
    try {
      const result = await client.query(
        "SELECT id, nombre, activo FROM areas_reporte ORDER BY id ASC",
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error al listar áreas reporte:", error);
      res.status(500).json({ error: "Error al listar áreas" });
    }
  });

  // POST /api/areasReporte - crear área
  router.post("/", authRequired(), async (req: any, res: any) => {
    try {
      const { nombre } = req.body;
      if (!nombre?.trim())
        return res.status(400).json({ error: "El nombre es requerido" });
      const result = await client.query(
        "INSERT INTO areas_reporte (nombre) VALUES ($1) RETURNING id, nombre, activo",
        [nombre.trim()],
      );
      res.json(result.rows[0]);
    } catch (error: any) {
      if (error.code === "23505")
        return res
          .status(400)
          .json({ error: "Ya existe un área con ese nombre" });
      console.error("Error al crear área reporte:", error);
      res.status(500).json({ error: "Error al crear área" });
    }
  });

  // PUT /api/areasReporte/:id - editar área
  router.put("/:id", authRequired(), async (req: any, res: any) => {
    try {
      const { nombre, activo } = req.body;
      if (!nombre?.trim())
        return res.status(400).json({ error: "El nombre es requerido" });
      const result = await client.query(
        "UPDATE areas_reporte SET nombre = $1, activo = $2 WHERE id = $3 RETURNING id, nombre, activo",
        [nombre.trim(), activo ?? true, req.params.id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Área no encontrada" });
      res.json(result.rows[0]);
    } catch (error: any) {
      if (error.code === "23505")
        return res
          .status(400)
          .json({ error: "Ya existe un área con ese nombre" });
      console.error("Error al editar área reporte:", error);
      res.status(500).json({ error: "Error al editar área" });
    }
  });

  // DELETE /api/areasReporte/:id - eliminar área
  router.delete("/:id", authRequired(), async (req: any, res: any) => {
    try {
      // Verificar si tiene reportes asociados
      const check = await client.query(
        "SELECT COUNT(*) FROM reportes_trabajo_diario WHERE area_id = $1",
        [req.params.id],
      );
      if (parseInt(check.rows[0].count) > 0) {
        return res.status(400).json({
          error: "No se puede eliminar: el área tiene reportes asociados",
        });
      }
      await client.query("DELETE FROM areas_reporte WHERE id = $1", [
        req.params.id,
      ]);
      res.json({ ok: true });
    } catch (error: any) {
      console.error("Error al eliminar área reporte:", error);
      res.status(500).json({ error: "Error al eliminar área" });
    }
  });

  return router;
};
