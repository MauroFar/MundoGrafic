// ordenTrabajo.js
const express = require("express");

module.exports = (client) => {
  const router = express.Router();

  // Aquí pondremos las rutas (crear, obtener, etc.)
// Obtener nombre del cliente y el primer concepto de la cotización
router.get("/datosCotizacion/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query(`
     SELECT 
        cl.nombre_cliente AS nombre_cliente,
        dc.detalle AS concepto,
		c.numero_cotizacion As numero_cotizacion
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN detalle_cotizacion dc ON c.id = dc.cotizacion_id
      WHERE c.id = $1

      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cotización no encontrada o sin detalles" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener datos de cotización:", error);
    res.status(500).json({ error: "Error al obtener los datos de la cotización" });
  }
});

// Crear una orden de trabajo desde una cotización
router.post("/crearOrdenTrabajo", async (req, res) => {
  const { nombre_cliente, concepto, id_cotizacion,fecha_creacion } = req.body;

  try {
    const result = await client.query(`
      INSERT INTO orden_trabajo (nombre_cliente, concepto, id_cotizacion,fecha_creacion)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [nombre_cliente, concepto, id_cotizacion,fecha_creacion]);

    res.status(201).json({ message: "Orden de trabajo creada", orden: result.rows[0] });
  } catch (error) {
    console.error("Error al crear orden de trabajo:", error);
    res.status(500).json({ error: "No se pudo crear la orden de trabajo" });
  }
});


/// GET: Listar todas las órdenes de trabajo
router.get('/listar', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto
      FROM orden_trabajo ot
      ORDER BY ot.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar órdenes:', error);
    res.status(500).json({ error: 'Error del servidor al obtener las órdenes de trabajo' });
  }
});

  return router;
};
