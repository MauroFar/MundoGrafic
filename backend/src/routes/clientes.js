const express = require("express");
const router = express.Router();

const createCliente = (client) => {
  // Ruta para crear una cotización y guardar todos los datos del cliente
  router.post("/", async (req, res) => {
    const { nombre, ruc_id } = req.body; // Solo el nombre se recibe del frontend
    const direccion = "Dirección de prueba"; // Puedes llenar estos valores manualmente
    const telefono = "1234567890"; // Llenado manualmente
    const email = "cliente@correo.com"; // Llenado manualmente
    
    // Primero, buscamos si el cliente ya existe
    const checkQuery = `
      SELECT id FROM clientes 
      WHERE nombre_cliente = $1 AND ruc_id = $2
    `;
    
    try {
      const checkResult = await client.query(checkQuery, [nombre, ruc_id]);
      
      if (checkResult.rows.length > 0) {
        // Si el cliente ya existe, solo devolvemos el id
        const clienteId = checkResult.rows[0].id;
        res.json({ clienteId });
      } else {
        // Si el cliente no existe, lo insertamos en la base de datos
        const insertQuery = `
          INSERT INTO clientes (nombre_cliente, direccion_cliente, telefono_cliente, email_cliente, ruc_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;
        
        const result = await client.query(insertQuery, [nombre, direccion, telefono, email, ruc_id]);
        const clienteId = result.rows[0].id; // Obtener el id del nuevo cliente
        
        res.json({ clienteId });
      }
    } catch (error) {
      console.error('Error al procesar el cliente:', error);
      res.status(500).json({ error: 'Error al procesar el cliente' });
    }
  });

  /*buscar clientes en la bbddd*/
  // Nueva ruta para buscar clientes
  router.get("/buscar", async (req, res) => {
    const { nombre, ruc_id } = req.query; // Obtener el nombre que se busca
    
    // Consulta SQL para buscar clientes que coincidan con el nombre (insensible a mayúsculas)
    const query = `
      SELECT id, nombre_cliente FROM clientes 
      WHERE nombre_cliente ILIKE $1 AND ruc_id = $2
    `;

    try {
      const result = await client.query(query, [`%${nombre}%`, ruc_id]); // Usamos el operador ILIKE para búsqueda insensible a mayúsculas
      res.json(result.rows); // Devolver los clientes encontrados
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      res.status(500).json({ error: 'Error al buscar clientes' });
    }
  });

  return router;
};

module.exports = createCliente;
