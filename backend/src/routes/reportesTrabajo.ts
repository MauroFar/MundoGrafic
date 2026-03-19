import express from "express";
import authRequired from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";

export default (client: any) => {
  const router = express.Router();

  // GET /api/reportesTrabajo?area_id=&operador_id=&fecha=
  router.get(
    "/",
    authRequired(),
    checkPermission(client, "reportes", "leer"),
    async (req: any, res: any) => {
      try {
        const { area_id, operador_id, fecha } = req.query;
        const conditions: string[] = [];
        const params: any[] = [];

        if (area_id) {
          params.push(area_id);
          conditions.push(`r.area_id = $${params.length}`);
        }
        if (operador_id) {
          params.push(operador_id);
          conditions.push(`r.operador_id = $${params.length}`);
        }
        if (fecha) {
          params.push(fecha);
          conditions.push(`r.fecha = $${params.length}`);
        }

        const where = conditions.length
          ? `WHERE ${conditions.join(" AND ")}`
          : "";

        const query = `
          SELECT
            r.id,
            r.area_id,   a.nombre AS area,
            r.operador_id, o.nombre AS operador,
            r.proceso,
            r.solicitado_por,
            to_char(r.inicio, 'HH24:MI') AS inicio,
            to_char(r.fin,   'HH24:MI') AS fin,
            r.fecha,
            r.created_at
          FROM reportes_trabajo_diario r
          JOIN areas_reporte      a ON a.id = r.area_id
          JOIN operadores_reporte o ON o.id = r.operador_id
          ${where}
          ORDER BY r.fecha DESC, o.nombre ASC, r.inicio ASC
        `;

        const result = await client.query(query, params);
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error al listar reportes:", error);
        res.status(500).json({ error: "Error al listar reportes" });
      }
    },
  );

  // POST /api/reportesTrabajo
  router.post(
    "/",
    authRequired(),
    checkPermission(client, "reportes", "crear"),
    async (req: any, res: any) => {
      try {
        const {
          area_id,
          operador_id,
          proceso,
          solicitado_por,
          inicio,
          fin,
          fecha,
        } = req.body;

        if (!area_id || !operador_id || !proceso || !inicio || !fin) {
          return res.status(400).json({
            error:
              "Campos requeridos: area_id, operador_id, proceso, inicio, fin",
          });
        }

        const insert = `
          INSERT INTO reportes_trabajo_diario
            (area_id, operador_id, proceso, solicitado_por, inicio, fin, fecha)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, area_id, operador_id, proceso, solicitado_por,
                    to_char(inicio, 'HH24:MI') AS inicio,
                    to_char(fin,   'HH24:MI') AS fin,
                    fecha, created_at
        `;

        const params = [
          area_id,
          operador_id,
          proceso,
          solicitado_por || null,
          inicio,
          fin,
          fecha || new Date().toISOString().split("T")[0],
        ];

        const inserted = await client.query(insert, params);
        const row = inserted.rows[0];

        // Enriquecer con los nombres para devolver al frontend
        const names = await client.query(
          `SELECT a.nombre AS area, o.nombre AS operador
           FROM areas_reporte a, operadores_reporte o
           WHERE a.id = $1 AND o.id = $2`,
          [area_id, operador_id],
        );
        res.json({ ...row, ...names.rows[0] });
      } catch (error: any) {
        console.error("Error al crear reporte:", error);
        res.status(500).json({ error: "Error al crear reporte" });
      }
    },
  );

  return router;
};
