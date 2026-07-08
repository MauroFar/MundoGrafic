import express from 'express';
import bcrypt from 'bcryptjs';
import { createAuthRoutes } from '../presentation/routes/auth/authRoutes';

const router = express.Router();

export default (client: any) => {
  const authRoutes = createAuthRoutes(client);

  router.use(authRoutes);

  // Registro de usuario (solo para pruebas, restringir en producción)
  router.post('/register', async (req: any, res: any) => {
    const { email, password, nombre, rol, area_id } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await client.query(
        'INSERT INTO usuarios (email, password_hash, nombre, rol, area_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, area_id',
        [email, hash, nombre, rol, area_id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  return router;
};