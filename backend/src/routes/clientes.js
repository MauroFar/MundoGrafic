  const express = require("express");
  const router = express.Router();

  const createCliente = (client) => {
    // Ruta para crear una cotización y guardar todos los datos del cliente
    router.post("/", async (req, res) => {
      const { nombre, ruc_id } = req.body; // Solo el nombre se recibe del frontend
      const direccion = "Dirección de prueba"; // Puedes llenar estos valores manualmente
      const telefono = "1234567890"; // Llenado manualmente
      const email = "cliente@correo.com"; // Llenado manualmente
      
      // Consulta SQL para insertar todos los datos en la tabla 'clientes'
      const query = `
        INSERT INTO clientes (nombre_cliente, direccion_cliente, telefono_cliente, email_cliente, ruc_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nombre_cliente, direccion_cliente, telefono_cliente, email_cliente, ruc_id
      `;
      
      try {
        const result = await client.query(query, [nombre, direccion, telefono, email, ruc_id]); // Ejecutamos la consulta
        res.json(result.rows[0]); // Devolver la respuesta con el id y los datos insertados
      } catch (error) {
        console.error('Error al insertar cliente:', error);
        res.status(500).json({ error: 'Error al insertar cliente' });
      }
    });

    
     // 🚀 NUEVO: Ruta para buscar clientes por nombre y ruc_id
  router.get("/", async (req, res) => {
    const { ruc_id, nombre } = req.query;

    if (!ruc_id) {
      return res.status(400).json({ error: 'El ruc_id es obligatorio' });
    }

    try {
      let query = `SELECT nombre_cliente FROM clientes WHERE ruc_id = $1`;
      let params = [ruc_id];

      if (nombre) {
        query += ` AND nombre_cliente ILIKE $2`;
        params.push(`%${nombre}%`);
      }

      const result = await client.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al buscar clientes:", error);
      res.status(500).json({ error: "Error al buscar clientes" });
    }
  });

    return router;
  };

  module.exports = createCliente;
