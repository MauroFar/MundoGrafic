import express from "express";

export default (client: any) => {
  const router = express.Router();

  // Listar reportes con filtros opcionales: area, operador
  router.get("/", async (req: any, res: any) => {
    try {
      const { area, operador } = req.query;
      const conditions: string[] = [];
      const params: any[] = [];

      if (area) {
        params.push(area);
        conditions.push(`area = $${params.length}`);
      }
      if (operador) {
        params.push(operador);
        conditions.push(`operador = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const query = `SELECT id, area, operador, proceso, to_char(inicio, 'HH24:MI') as inicio, to_char(fin, 'HH24:MI') as fin, created_at
                     FROM reportes_trabajo_diario ${where}
                     ORDER BY created_at DESC, id DESC`;
      const result = await client.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error al listar reportes:", error);
      res.status(500).json({ error: "Error al listar reportes" });
    }
  });

  // Crear un nuevo reporte
  router.post("/", async (req: any, res: any) => {
    try {
      const { area, operador, proceso, inicio, fin } = req.body;
      if (!area || !proceso || !inicio || !fin) {
        return res.status(400).json({ error: "Campos requeridos: area, proceso, inicio, fin" });
      }

      const insert = `INSERT INTO reportes_trabajo_diario (area, operador, proceso, inicio, fin)
                      VALUES ($1, $2, $3, $4, $5)
                      RETURNING id, area, operador, proceso, to_char(inicio, 'HH24:MI') as inicio, to_char(fin, 'HH24:MI') as fin, created_at`;
      const params = [area, operador || null, proceso, inicio, fin];
      const result = await client.query(insert, params);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error al crear reporte:", error);
      res.status(500).json({ error: "Error al crear reporte" });
    }
  });

  return router;
};


