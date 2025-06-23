const express = require("express");
const router = express.Router();

module.exports = function(client) {
  // Obtener o crear un ejecutivo
  router.post("/obtenerOCrear", async (req, res) => {
    const { nombre } = req.body;
    
    try {
      // Primero buscar si el ejecutivo ya existe
      let result = await client.query(
        "SELECT id FROM ejecutivos WHERE nombre = $1",
        [nombre]
      );

      if (result.rows.length > 0) {
        // Si existe, retornar el id existente
        res.json({ id: result.rows[0].id });
      } else {
        // Si no existe, crear nuevo ejecutivo
        result = await client.query(
          "INSERT INTO ejecutivos (nombre) VALUES ($1) RETURNING id",
          [nombre]
        );
        res.json({ id: result.rows[0].id });
      }
    } catch (error) {
      console.error("Error al procesar ejecutivo:", error);
      res.status(500).json({ error: "Error al procesar ejecutivo" });
    }
  });

  // Buscar ejecutivos por nombre parcial (para autocompletar)
  router.get('/buscar', async (req, res) => {
    const { nombre } = req.query;
    try {
      const result = await client.query(
        'SELECT id, nombre FROM ejecutivos WHERE LOWER(nombre) LIKE LOWER($1) ORDER BY nombre LIMIT 10',
        [`%${nombre || ''}%`]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error al buscar ejecutivos:', error);
      res.status(500).json({ error: 'Error al buscar ejecutivos' });
    }
  });

  return router;
}; 