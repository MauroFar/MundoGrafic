const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'TU_SECRETO';

module.exports = (client) => {
  // Registro de usuario (solo para pruebas, restringir en producción)
  router.post('/register', async (req, res) => {
    const { email, password, nombre, rol, area_id } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await client.query(
        'INSERT INTO usuarios (email, password_hash, nombre, rol, area_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, area_id',
        [email, hash, nombre, rol, area_id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Login de usuario
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      // Buscar por email o por nombre_usuario
      const result = await client.query('SELECT * FROM usuarios WHERE email = $1 OR nombre_usuario = $1', [email]);
      const user = result.rows[0];
      if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

      const token = jwt.sign(
        { id: user.id, rol: user.rol, nombre: user.nombre, email: user.email },
        SECRET,
        { expiresIn: '8h' }
      );
      res.json({ token, user: { id: user.id, rol: user.rol, nombre: user.nombre, email: user.email } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}; 