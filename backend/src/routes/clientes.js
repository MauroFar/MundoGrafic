const express = require("express");
const router = express.Router();

const createCliente = (client) => {
  // Agregar un middleware de logging
  router.use((req, res, next) => {
    console.log(`[Clientes API] ${req.method} ${req.url}`);
    next();
  });

  // Ruta para buscar clientes
  router.get("/buscar", async (req, res) => {
    const { q } = req.query;
    // Validar: al menos 2 caracteres y al menos una letra
    if (!q || q.trim().length < 2 || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(q)) {
      return res.json([]); // No sugerencias si no cumple
    }
    try {
      const query = `
        SELECT id, nombre_cliente, email_cliente
        FROM clientes
        WHERE nombre_cliente ILIKE $1 OR email_cliente ILIKE $1
        ORDER BY nombre_cliente ASC
        LIMIT 10
      `;
      const result = await client.query(query, [`%${q}%`]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar clientes', details: error.message });
    }
  });

  // Ruta para crear un cliente
  router.post("/", async (req, res) => {
    const { nombre } = req.body;
    
    try {
      // Verificar si el cliente ya existe
      const checkQuery = `
        SELECT id FROM clientes 
        WHERE nombre_cliente = $1
      `;
      
      const checkResult = await client.query(checkQuery, [nombre]);
      
      if (checkResult.rows.length > 0) {
        // Si el cliente ya existe, devolver su ID
        return res.json({ clienteId: checkResult.rows[0].id });
      }

      // Si el cliente no existe, crearlo
      const insertQuery = `
        INSERT INTO clientes (nombre_cliente)
        VALUES ($1)
        RETURNING id
      `;
      
      const result = await client.query(insertQuery, [nombre]);
      res.json({ clienteId: result.rows[0].id });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      res.status(500).json({ 
        error: 'Error al crear cliente',
        details: error.message 
      });
    }
  });

  return router;
};

module.exports = createCliente;
