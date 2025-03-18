// routes/cotizaciones.js

module.exports = (client) => {
    const express = require('express');
    const router = express.Router();
  
    // Ruta POST para crear una cotización
    router.post('/crear', async (req, res) => {
      const { cliente } = req.body;  // Extraemos el nombre del cliente desde el cuerpo de la solicitud
  
      if (!cliente) {
        return res.status(400).json({ error: 'El nombre del cliente es requerido' });
      }
  
      try {
        // Insertamos el nombre del cliente y la fecha en la base de datos
        const query = `
          INSERT INTO cotizaciones (cliente, fecha) 
          VALUES ($1, CURRENT_DATE) 
          RETURNING id, cliente, fecha
        `;
        const values = [cliente];
  
        // Ejecutamos la consulta
        const result = await client.query(query, values);
        const nuevaCotizacion = result.rows[0];  // Obtiene la cotización recién insertada
  
        return res.status(201).json(nuevaCotizacion);  // Retornamos la cotización creada
      } catch (err) {
        console.error('Error al insertar cotización:', err);
        return res.status(500).json({ error: 'Error al crear cotización' });
      }
    });
  
    return router;  // Devolvemos el router para ser utilizado en el servidor
  };
  