import express from "express";
import authRequired from "../middleware/auth";

export default (client: any) => {
  const router = express.Router();

  // GET /api/operadoresReporte?area_id= - listar operadores (filtrar por área opcional)
  router.get("/", authRequired(), async (req: any, res: any) => {
    try {
      const { area_id } = req.query;
      let query = `
        SELECT o.id, o.nombre, o.activo, o.area_id, a.nombre AS area_nombre
        FROM operadores_reporte o
        LEFT JOIN areas_reporte a ON a.id = o.area_id
      `;
      const params: any[] = [];
      if (area_id) {
        params.push(area_id);
        query += ` WHERE o.area_id = $1`;
      }
      query += ` ORDER BY o.nombre ASC`;
      const result = await client.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error al listar operadores reporte:", error);
      res.status(500).json({ error: "Error al listar operadores" });
    }
  });

  // POST /api/operadoresReporte - crear operador con área
  router.post("/", authRequired(), async (req: any, res: any) => {
    try {
      const { nombre, area_id } = req.body;
      if (!nombre?.trim())
        return res.status(400).json({ error: "El nombre es requerido" });
      if (!area_id)
        return res.status(400).json({ error: "El área es requerida" });
      const result = await client.query(
        `INSERT INTO operadores_reporte (nombre, area_id)
         VALUES ($1, $2)
         RETURNING id, nombre, activo, area_id`,
        [nombre.trim(), area_id],
      );
      // Devolver con nombre de área
      const row = result.rows[0];
      const area = await client.query(
        "SELECT nombre FROM areas_reporte WHERE id = $1",
        [area_id],
      );
      res.json({ ...row, area_nombre: area.rows[0]?.nombre });
    } catch (error: any) {
      console.error("Error al crear operador reporte:", error);
      res.status(500).json({ error: "Error al crear operador" });
    }
  });

  // PUT /api/operadoresReporte/:id - editar operador
  router.put("/:id", authRequired(), async (req: any, res: any) => {
    try {
      const { nombre, activo, area_id } = req.body;
      if (!nombre?.trim())
        return res.status(400).json({ error: "El nombre es requerido" });
      const result = await client.query(
        `UPDATE operadores_reporte
         SET nombre = $1, activo = $2, area_id = $3
         WHERE id = $4
         RETURNING id, nombre, activo, area_id`,
        [nombre.trim(), activo ?? true, area_id ?? null, req.params.id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Operador no encontrado" });
      const row = result.rows[0];
      const area = await client.query(
        "SELECT nombre FROM areas_reporte WHERE id = $1",
        [row.area_id],
      );
      res.json({ ...row, area_nombre: area.rows[0]?.nombre });
    } catch (error: any) {
      console.error("Error al editar operador reporte:", error);
      res.status(500).json({ error: "Error al editar operador" });
    }
  });

  // DELETE /api/operadoresReporte/:id - eliminar operador
  router.delete("/:id", authRequired(), async (req: any, res: any) => {
    try {
      const check = await client.query(
        "SELECT COUNT(*) FROM reportes_trabajo_diario WHERE operador_id = $1",
        [req.params.id],
      );
      if (parseInt(check.rows[0].count) > 0) {
        return res
          .status(400)
          .json({
            error: "No se puede eliminar: el operador tiene reportes asociados",
          });
      }
      await client.query("DELETE FROM operadores_reporte WHERE id = $1", [
        req.params.id,
      ]);
      res.json({ ok: true });
    } catch (error: any) {
      console.error("Error al eliminar operador reporte:", error);
      res.status(500).json({ error: "Error al eliminar operador" });
    }
  });

  return router;
};
