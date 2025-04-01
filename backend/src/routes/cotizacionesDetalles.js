const express = require("express");
const router = express.Router();

const createCotizacionDetalles = (client) => {
  // Ruta para crear detalles de cotización con datos ficticios
  router.post("/prueba", async (req, res) => {
    console.log(req.body);  // Verifica lo que estás recibiendo en el backend
    const { cotizacion_id, detalles } = req.body;  // Recibimos cotizacion_id y detalles

    // Verificar que los detalles se han recibido correctamente
    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ error: "Faltan detalles en la solicitud" });
    }

    // Consulta SQL para insertar detalles de cotización
    const query = `
      INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total
    `;
    
    try {
      // Crear un array de promesas para insertar los detalles ficticios
      const promises = detalles.map(async (detalle) => {
        const { cantidad, detalle: descripcion, valor_unitario, valor_total } = detalle;
        
        // Ejecutar la consulta por cada detalle
        const result = await client.query(query, [
          cotizacion_id, 
          cantidad,
          descripcion,
          valor_unitario,
          valor_total,
        ]);
        return result.rows[0]; // Retorna el detalle insertado
      });

      // Esperamos que todas las inserciones se completen
      const resultadosDetalles = await Promise.all(promises);

      // Responder con los detalles insertados
      res.json(resultadosDetalles);
    } catch (error) {
      console.error("Error al insertar los detalles de cotización:", error);
      res.status(500).json({ error: "Error al insertar los detalles de cotización" });
    }
  });

  return router;
};

module.exports = createCotizacionDetalles;
