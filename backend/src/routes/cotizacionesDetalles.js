const express = require("express");
const router = express.Router();

const createCotizacionDetalles = (client) => {
  // Obtener detalles de una cotización por ID
  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const query = `
        SELECT 
          id, 
          cotizacion_id, 
          cantidad, 
          detalle, 
          CAST(valor_unitario AS DECIMAL(10,2)) as valor_unitario, 
          CAST(valor_total AS DECIMAL(10,2)) as valor_total,
          imagen_ruta,
          imagen_width,
          imagen_height
        FROM detalle_cotizacion
        WHERE cotizacion_id = $1
        ORDER BY id ASC
      `;
      const result = await client.query(query, [id]);
      console.log("Detalles encontrados:", result.rows); // Para debugging
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener detalles de la cotización:", error);
      res.status(500).json({ error: "Error al obtener los detalles de la cotización" });
    }
  });

  // Ruta para crear detalles de cotización
  router.post("/", async (req, res) => {
    console.log("Recibiendo datos para crear detalle:", req.body);
    const { cotizacion_id, cantidad, detalle, valor_unitario, valor_total, imagen_ruta, imagen_width, imagen_height } = req.body;

    if (!cotizacion_id || !cantidad || !detalle || !valor_unitario || !valor_total) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    try {
      const query = `
        INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, imagen_ruta, imagen_width, imagen_height)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, imagen_ruta, imagen_width, imagen_height
      `;
      
      const result = await client.query(query, [
        cotizacion_id,
        cantidad,
        detalle,
        valor_unitario,
        valor_total,
        imagen_ruta,
        imagen_width,
        imagen_height
      ]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al insertar detalle de cotización:", error);
      res.status(500).json({ error: "Error al insertar detalle de cotización" });
    }
  });

  // Actualizar detalles de una cotización
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { detalles } = req.body;

    console.log("Detalles recibidos:", detalles); // Para debugging

    if (!detalles || !Array.isArray(detalles)) {
      return res.status(400).json({ error: "Se requiere un array de detalles válido" });
    }

    try {
      // Primero eliminamos los detalles existentes
      await client.query("DELETE FROM detalle_cotizacion WHERE cotizacion_id = $1", [id]);

      // Luego insertamos los nuevos detalles
      const query = `
        INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, imagen_ruta, imagen_width, imagen_height)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, imagen_ruta, imagen_width, imagen_height
      `;

      const resultadosDetalles = [];
      for (const detalle of detalles) {
        const { cantidad, detalle: descripcion, valor_unitario, valor_total, imagen_ruta, imagen_width, imagen_height } = detalle;
        
        // Validar que todos los campos requeridos estén presentes y sean válidos
        if (cantidad === undefined || descripcion === undefined || 
            valor_unitario === undefined || valor_total === undefined) {
          throw new Error("Faltan campos requeridos en los detalles");
        }

        const result = await client.query(query, [
          id,
          parseFloat(cantidad),
          descripcion,
          parseFloat(valor_unitario),
          parseFloat(valor_total),
          imagen_ruta,
          imagen_width,
          imagen_height
        ]);
        
        resultadosDetalles.push(result.rows[0]);
      }

      res.json(resultadosDetalles);
    } catch (error) {
      console.error("Error al actualizar los detalles de la cotización:", error);
      res.status(500).json({ error: error.message || "Error al actualizar los detalles de la cotización" });
    }
  });

  return router;
};

module.exports = createCotizacionDetalles;
