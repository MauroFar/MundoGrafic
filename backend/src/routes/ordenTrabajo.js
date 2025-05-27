// ordenTrabajo.js
const express = require("express");

module.exports = (client) => {
  const router = express.Router();

  // Obtener nombre del cliente y el primer concepto de la cotización
  router.get("/datosCotizacion/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const result = await client.query(`
        SELECT 
          cl.nombre_cliente AS nombre_cliente,
          dc.detalle AS concepto,
          c.numero_cotizacion AS numero_cotizacion,
          ot.numero_orden AS numero_orden
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN detalle_cotizacion dc ON c.id = dc.cotizacion_id
        LEFT JOIN orden_trabajo ot ON c.id = ot.id_cotizacion
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
    const { nombre_cliente, concepto, id_cotizacion, fecha_creacion } = req.body;

    try {
      const result = await client.query(`
        INSERT INTO orden_trabajo (nombre_cliente, concepto, id_cotizacion, fecha_creacion)
        VALUES ($1, $2, $3, $4)
        RETURNING numero_orden
      `, [nombre_cliente, concepto, id_cotizacion, fecha_creacion]);

      const numeroOrdenGenerado = result.rows[0].numero_orden;

      // Formato con ceros al inicio (ej: 000001)
      const numeroFormateado = String(numeroOrdenGenerado).padStart(6, '0');

      res.status(201).json({
        message: "Orden de trabajo creada",
        numero_orden: numeroFormateado
      });
    } catch (error) {
      console.error("Error al crear orden de trabajo:", error);
      res.status(500).json({ error: "No se pudo crear la orden de trabajo" });
    }
  });

  // GET: Listar todas las órdenes de trabajo
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


  router.get("/buscar", async (req, res) => {
    const { ruc_id } = req.query;

    if (!ruc_id) {
      return res.status(400).json({ error: "El ruc_id es obligatorio" });
    }

    try {
      const query = `
     SELECT 
          ot.id,
          ot.numero_orden,
          ot.fecha_creacion,
          c.nombre_cliente,
          d.detalle
        FROM orden_trabajo ot
        JOIN cotizaciones co ON ot.id_cotizacion = co.id
        JOIN clientes c ON co.cliente_id = c.id
        JOIN detalle_cotizacion d ON d.cotizacion_id = co.id
        WHERE c.ruc_id = $1
      `;

      const result = await client.query(query, [ruc_id]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al buscar órdenes de trabajo:", error);
      res.status(500).json({ error: "Error al buscar órdenes de trabajo" });
    }
  });

  // Obtener datos de una orden de trabajo por ID
router.get('/orden/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(
      `SELECT id, nombre_cliente, concepto, numero_orden, fecha_creacion
FROM orden_trabajo 
WHERE id = $1;
`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener la orden:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/////editar y actualizar datos orden de trabajo   // Editar una orden de trabajo existente
  router.put('/editarOrden/:id', async (req, res) => {
    const { id } = req.params;
    const {
      nombre_cliente,
      concepto,
      fecha_creacion
      // Puedes agregar más campos si tu tabla tiene otros
    } = req.body;

    try {
      const result = await client.query(
        `
        UPDATE orden_trabajo
        SET nombre_cliente = $1,
            concepto = $2,
            fecha_creacion = $3
        WHERE id = $4
        RETURNING *
        `,
        [nombre_cliente, concepto, fecha_creacion, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      res.json({
        message: "Orden actualizada correctamente",
        orden: result.rows[0],
      });
    } catch (error) {
      console.error("Error al editar la orden de trabajo:", error.message);
      res.status(500).json({ error: "Error al actualizar la orden de trabajo" });
    }
  });

  


  return router;
};
