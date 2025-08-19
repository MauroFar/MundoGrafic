const express = require('express');
const router = express.Router();
const authRequired = require('../middleware/auth');

module.exports = (client) => {
  // Listar todas las áreas (solo admin)
  router.get('/', authRequired(['admin']), async (req, res) => {
    const result = await client.query('SELECT id, nombre FROM areas');
    res.json(result.rows);
  });
  return router;
}; 