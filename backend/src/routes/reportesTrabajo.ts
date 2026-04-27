import express from "express";
import authRequired from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";

export default (client: any) => {
  const router = express.Router();

  // GET /api/reportesTrabajo?area_id=&operador_id=&fecha=&fecha_desde=&fecha_hasta=
  router.get(
    "/",
    authRequired(),
    checkPermission(client, "reportes", "leer"),
    async (req: any, res: any) => {
      try {
        const { area_id, operador_id, fecha, fecha_desde, fecha_hasta } = req.query;
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
        } else {
          if (fecha_desde) {
            params.push(fecha_desde);
            conditions.push(`r.fecha >= $${params.length}`);
          }
          if (fecha_hasta) {
            params.push(fecha_hasta);
            conditions.push(`r.fecha <= $${params.length}`);
          }
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

  // GET /api/reportesTrabajo/fechas?operador_id=&area_id=&fecha_desde=&fecha_hasta=
  // Devuelve las fechas (con nombre del día y total de registros) que tienen reportes para un operador dado.
  router.get(
    "/fechas",
    authRequired(),
    checkPermission(client, "reportes", "leer"),
    async (req: any, res: any) => {
      try {
        const { operador_id, area_id, fecha_desde, fecha_hasta } = req.query;
        if (!operador_id) {
          return res.status(400).json({ error: "operador_id es requerido" });
        }

        const params: any[] = [operador_id];
        const extraFilters: string[] = [];
        if (area_id) {
          params.push(area_id);
          extraFilters.push(`AND r.area_id = $${params.length}`);
        }
        if (fecha_desde) {
          params.push(fecha_desde);
          extraFilters.push(`AND r.fecha >= $${params.length}`);
        }
        if (fecha_hasta) {
          params.push(fecha_hasta);
          extraFilters.push(`AND r.fecha <= $${params.length}`);
        }

        const query = `
          SELECT
            r.fecha::text                                        AS fecha,
            TO_CHAR(r.fecha, 'Day')                             AS dia_semana_raw,
            COUNT(*)::int                                        AS total
          FROM reportes_trabajo_diario r
          WHERE r.operador_id = $1
          ${extraFilters.join("\n")}
          GROUP BY r.fecha
          ORDER BY r.fecha DESC
        `;

        const result = await client.query(query, params);
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error al listar fechas:", error);
        res.status(500).json({ error: "Error al listar fechas" });
      }
    },
  );

  // PUT /api/reportesTrabajo/:id
  router.put(
    "/:id",
    authRequired(),
    checkPermission(client, "reportes", "editar"),
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
          return res
            .status(400)
            .json({
              error:
                "Campos requeridos: area_id, operador_id, proceso, inicio, fin",
            });
        }
        const update = `
          UPDATE reportes_trabajo_diario
          SET area_id=$1, operador_id=$2, proceso=$3, solicitado_por=$4, inicio=$5, fin=$6, fecha=$7
          WHERE id=$8
          RETURNING id, area_id, operador_id, proceso, solicitado_por,
                    to_char(inicio, 'HH24:MI') AS inicio,
                    to_char(fin,   'HH24:MI') AS fin,
                    fecha, created_at
        `;
        const result = await client.query(update, [
          area_id,
          operador_id,
          proceso,
          solicitado_por || null,
          inicio,
          fin,
          fecha || new Date().toISOString().split("T")[0],
          req.params.id,
        ]);
        if (result.rows.length === 0)
          return res.status(404).json({ error: "Registro no encontrado" });
        const row = result.rows[0];
        const names = await client.query(
          `SELECT a.nombre AS area, o.nombre AS operador
           FROM areas_reporte a, operadores_reporte o
           WHERE a.id = $1 AND o.id = $2`,
          [area_id, operador_id],
        );
        res.json({ ...row, ...names.rows[0] });
      } catch (error: any) {
        console.error("Error al editar reporte:", error);
        res.status(500).json({ error: "Error al editar reporte" });
      }
    },
  );

  // DELETE /api/reportesTrabajo/:id
  router.delete(
    "/:id",
    authRequired(),
    checkPermission(client, "reportes", "eliminar"),
    async (req: any, res: any) => {
      try {
        const result = await client.query(
          "DELETE FROM reportes_trabajo_diario WHERE id=$1 RETURNING id",
          [req.params.id],
        );
        if (result.rows.length === 0)
          return res.status(404).json({ error: "Registro no encontrado" });
        res.json({ ok: true });
      } catch (error: any) {
        console.error("Error al eliminar reporte:", error);
        res.status(500).json({ error: "Error al eliminar reporte" });
      }
    },
  );

  return router;
};
