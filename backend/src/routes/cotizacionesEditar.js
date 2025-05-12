const express = require("express");
const router = express.Router();

module.exports = function(client) {
  // Obtener la cotización específica por ID
  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await client.query(`
  	SELECT 
  c.id, 
  c.numero_cotizacion, 
  c.fecha, 
  c.estado,
  c.subtotal,
  c.iva,
  c.descuento,
  c.total,
  cl.nombre_cliente,
  e.nombre AS nombre_ejecutivo,
  r.ruc 
FROM cotizaciones c
JOIN clientes cl ON c.cliente_id = cl.id
JOIN rucs r ON c.ruc_id = r.id
JOIN ejecutivos e ON r.ejecutivo_id = e.id
WHERE c.id = $1;
      `, [id]);

      if (result.rows.length > 0) {
        res.json(result.rows[0]); // Retorna la cotización encontrada
      } else {
        res.status(404).json({ error: "Cotización no encontrada" });
      }
    } catch (err) {
      console.error("Error al obtener la cotización:", err);
      res.status(500).json({ error: "Error al obtener los datos" });
    }
  });

  return router;
};
