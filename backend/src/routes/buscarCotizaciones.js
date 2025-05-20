const express = require("express");
const router = express.Router();

module.exports = (client) => {
  router.get("/buscar", async (req, res) => {
    const { ruc_id, nombre } = req.query;
  
    if (!ruc_id) {
      return res.status(400).json({ error: 'El ruc_id es obligatorio' });
    }
  
    try {
      let query = `
        SELECT 
        co.id AS cotizacion_id,
          c.nombre_cliente,
          co.numero_cotizacion,
          co.fecha,
          co.estado,
          dc.detalle
        FROM clientes c
        JOIN cotizaciones co ON co.cliente_id = c.id
        JOIN detalle_cotizacion dc ON dc.cotizacion_id = co.id
        WHERE c.ruc_id = $1
      `;
      let params = [ruc_id];
  
      if (nombre) {
        query += ` AND c.nombre_cliente ILIKE $2`;
        params.push(`%${nombre}%`);
      }
  
      const result = await client.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al buscar cotizaciones:", error);
      res.status(500).json({ error: "Error al buscar cotizaciones" });
    }
  });
// Nueva ruta para aprobar cotización
router.put("/:id/aprobar", async (req, res) => {
  const { id } = req.params;
  const { ruc_id } = req.body;

  if (!ruc_id) {
    return res.status(400).json({ error: "El ruc_id es obligatorio" });
  }

  try {
    const query = `
      UPDATE cotizaciones co
      SET estado = 'aprobada'
      FROM rucs r
      WHERE co.id = $1 
        AND co.ruc_id = r.id 
        AND r.id = $2
        AND co.estado = 'pendiente'
      RETURNING co.*;
    `;

    const result = await client.query(query, [id, ruc_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cotización no encontrada o ya aprobada" });
    }

    res.json({ message: "Cotización aprobada correctamente", cotizacion: result.rows[0] });
  } catch (error) {
    console.error("Error al aprobar cotización:", error);
    res.status(500).json({ error: "Error al aprobar cotización" });
  }
});

  
      return router;
    };