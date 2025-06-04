const express = require("express");
const router = express.Router();

const CotizacionDatos = (client) => {
  // Ruta para crear una cotización y guardar todos los datos del cliente
  router.post("/", async (req, res) => {
    const { 
      fecha, 
      subtotal, 
      iva, 
      descuento, 
      total, 
      ruc_id, 
      cliente_id, 
      ejecutivo_id  // Ahora recibimos ejecutivo_id en lugar de nombre_ejecutivo
    } = req.body;
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
        INSERT INTO cotizaciones (
          numero_cotizacion, 
          cliente_id, 
          fecha, 
          subtotal, 
          iva, 
          descuento, 
          total, 
          estado, 
          ruc_id,
          ejecutivo_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        nuevoNumeroCotizacion,
        cliente_id,
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        estado,
        ruc_id,
        ejecutivo_id
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

  // Obtener todas las cotizaciones con filtros simplificados
  router.get("/todas", async (req, res) => {
    console.log("Recibiendo petición en /todas");
    const { busqueda, fechaDesde, fechaHasta } = req.query;
    console.log("Parámetros recibidos:", { busqueda, fechaDesde, fechaHasta });
    
    try {
      let query = `
        SELECT 
          c.id,
          c.numero_cotizacion,
          cl.nombre_cliente,
          c.fecha,
          c.estado,
          c.total,
          r.ruc,
          r.descripcion as ruc_descripcion
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 1;

      if (busqueda) {
        query += ` AND (
          c.numero_cotizacion::text ILIKE $${paramCount} 
          OR cl.nombre_cliente ILIKE $${paramCount}
        )`;
        params.push(`%${busqueda}%`);
        paramCount++;
      }

      if (fechaDesde) {
        query += ` AND c.fecha >= $${paramCount}`;
        params.push(fechaDesde);
        paramCount++;
      }

      if (fechaHasta) {
        query += ` AND c.fecha <= $${paramCount}`;
        params.push(fechaHasta);
        paramCount++;
      }

      // Ordenar por fecha descendente y limitar a 5 si no hay filtros
      query += ` ORDER BY c.fecha DESC`;
      if (!busqueda && !fechaDesde && !fechaHasta) {
        query += ` LIMIT 5`;
      }

      console.log("Query a ejecutar:", query);
      console.log("Parámetros:", params);

      const result = await client.query(query, params);
      console.log("Resultados obtenidos:", result.rows.length);
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener cotizaciones:", error);
      res.status(500).json({ error: "Error al obtener las cotizaciones" });
    }
  });

  ///*Cotizaciones editar*////////
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const query = "SELECT * FROM cotizaciones WHERE id = $1";
      const result = await client.query(query, [id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al obtener cotización por ID:", error);
      res.status(500).json({ error: "Error al obtener cotización por ID" });
    }
  });

  // Actualizar una cotización existente
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { fecha, subtotal, iva, descuento, total, ruc_id, cliente_id } = req.body;

    try {
      const query = `
        UPDATE cotizaciones 
        SET fecha = $1, 
            subtotal = $2, 
            iva = $3, 
            descuento = $4, 
            total = $5, 
            ruc_id = $6, 
            cliente_id = $7
        WHERE id = $8
        RETURNING *
      `;

      const result = await client.query(query, [
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        ruc_id,
        cliente_id,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al actualizar la cotización:", error);
      res.status(500).json({ error: "Error al actualizar la cotización" });
    }
  });

  return router;
};

module.exports = CotizacionDatos;
