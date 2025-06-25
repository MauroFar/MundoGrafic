const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authRequired = require('../middleware/auth');

module.exports = (client) => {
  // Listar todos los usuarios (solo admin)
  router.get('/', authRequired(['admin']), async (req, res) => {
    const result = await client.query('SELECT id, email, nombre, rol, area_id, activo, fecha_creacion FROM usuarios');
    res.json(result.rows);
  });

  // Crear usuario (solo admin)
  router.post('/', authRequired(['admin']), async (req, res) => {
    const { email, nombre_usuario, password, nombre, rol, area_id } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await client.query(
        'INSERT INTO usuarios (email, nombre_usuario, password_hash, nombre, rol, area_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion',
        [email, nombre_usuario, hash, nombre, rol, area_id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Editar usuario (solo admin)
  router.put('/:id', authRequired(['admin']), async (req, res) => {
    const { id } = req.params;
    const { email, nombre_usuario, nombre, rol, area_id, activo, password } = req.body;
    try {
      let query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, area_id = $5, activo = $6';
      let params = [email, nombre_usuario, nombre, rol, area_id, activo, id];
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, area_id = $5, activo = $6, password_hash = $7 WHERE id = $8 RETURNING id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion';
        params = [email, nombre_usuario, nombre, rol, area_id, activo, hash, id];
      } else {
        query += ' WHERE id = $7 RETURNING id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion';
      }
      const result = await client.query(query, params);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Borrar usuario (solo admin)
  router.delete('/:id', authRequired(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  return router;
}; 