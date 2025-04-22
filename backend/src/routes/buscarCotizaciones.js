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
  
      return router;
    };