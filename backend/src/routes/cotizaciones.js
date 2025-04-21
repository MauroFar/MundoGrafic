const express = require("express");
const router = express.Router();

const CotizacionDatos = (client) => {
  // Ruta para crear una cotización y guardar todos los datos del cliente
  router.post("/", async (req, res) => {
    const { fecha, subtotal, iva, descuento, total, ruc_id, cliente_id } = req.body; // Asegúrate de recibir el cliente_id del frontend
    const estado = "pendiente";

    try {
      // 🔹 1️⃣ Obtener el último número de cotización
      const ultimoNumeroQuery = "SELECT numero_cotizacion FROM cotizaciones ORDER BY numero_cotizacion DESC LIMIT 1";
      const ultimoNumeroResult = await client.query(ultimoNumeroQuery);
      
      // 🔹 2️⃣ Determinar el nuevo número de cotización
      const nuevoNumeroCotizacion = ultimoNumeroResult.rows.length > 0 
        ? ultimoNumeroResult.rows[0].numero_cotizacion + 1 
        : 1; // Si no hay registros, comenzamos en 1
      
      // 🔹 3️⃣ Insertar la nueva cotización con el número generado
      const insertQuery = `
        INSERT INTO cotizaciones (numero_cotizacion, cliente_id, fecha, subtotal, iva, descuento, total, estado, ruc_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, numero_cotizacion, cliente_id, fecha, subtotal, iva, descuento, total, estado, ruc_id
      `;
      
      const result = await client.query(insertQuery, [
        nuevoNumeroCotizacion,
        cliente_id,  // Recibido desde el frontend
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        estado,
        ruc_id
      ]);

      res.json(result.rows[0]); // Respuesta con la nueva cotización creada
    } catch (error) {
      console.error("Error al insertar cotización:", error);
      res.status(500).json({ error: "Error al insertar cotización" });
    }
  });

  router.get("/ultima", async (req, res) => {
    try {
      const ultimoNumeroQuery = "SELECT numero_cotizacion FROM cotizaciones ORDER BY numero_cotizacion DESC LIMIT 1";
      const ultimoNumeroResult = await client.query(ultimoNumeroQuery);
      
      const ultimoNumeroCotizacion = ultimoNumeroResult.rows[0]?.numero_cotizacion || 0;
    
      // 🔹 Generar el nuevo número con 9 dígitos
      const nuevoNumeroCotizacion = (ultimoNumeroCotizacion + 1).toString().padStart(9, "0");
  
      // ✅ Enviar el número formateado con ceros al frontend
      res.json({ numero_cotizacion: nuevoNumeroCotizacion });
  
    } catch (error) {
      console.error("Error al obtener la última cotización:", error);
      res.status(500).json({ error: "Error al obtener la última cotización" });
    }
  });

  return router;
};

module.exports = CotizacionDatos;
