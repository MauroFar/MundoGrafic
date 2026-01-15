import { Router, Request, Response } from 'express';
import authRequired from '../middleware/auth';

const router = Router();

export default (client: any) => {
  /**
   * GET /api/prensas
   * Obtener todas las prensas activas
   */
  router.get('/', authRequired(), async (req: Request, res: Response) => {
    try {
      const result = await client.query(
        'SELECT id, nombre, descripcion, activo FROM prensas WHERE activo = true ORDER BY nombre'
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error al obtener prensas:', error);
      res.status(500).json({ error: 'Error al obtener prensas' });
    }
  });

  /**
   * GET /api/prensas/todas
   * Obtener todas las prensas (incluidas inactivas) - solo para admin
   */
  router.get('/todas', authRequired(), async (req: any, res: Response) => {
    try {
      // Verificar que sea admin
      if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const result = await client.query(
        'SELECT id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion FROM prensas ORDER BY nombre'
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error al obtener prensas:', error);
      res.status(500).json({ error: 'Error al obtener prensas' });
    }
  });

  /**
   * POST /api/prensas
   * Crear nueva prensa
   */
  router.post('/', authRequired(), async (req: Request, res: Response) => {
    const { nombre, descripcion } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la prensa es requerido' });
    }

    try {
      // Verificar si ya existe una prensa con ese nombre
      const existeResult = await client.query(
        'SELECT id FROM prensas WHERE LOWER(nombre) = LOWER($1)',
        [nombre.trim()]
      );

      if (existeResult.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe una prensa con ese nombre' });
      }

      const result = await client.query(
        'INSERT INTO prensas (nombre, descripcion, activo) VALUES ($1, $2, true) RETURNING id, nombre, descripcion, activo',
        [nombre.trim(), descripcion || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error al crear prensa:', error);
      res.status(500).json({ error: 'Error al crear prensa' });
    }
  });

  /**
   * PUT /api/prensas/:id
   * Actualizar prensa - solo admin
   */
  router.put('/:id', authRequired(), async (req: any, res: Response) => {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    // Verificar que sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la prensa es requerido' });
    }

    try {
      // Verificar si ya existe otra prensa con ese nombre
      const existeResult = await client.query(
        'SELECT id FROM prensas WHERE LOWER(nombre) = LOWER($1) AND id != $2',
        [nombre.trim(), id]
      );

      if (existeResult.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe otra prensa con ese nombre' });
      }

      const result = await client.query(
        'UPDATE prensas SET nombre = $1, descripcion = $2, activo = $3 WHERE id = $4 RETURNING id, nombre, descripcion, activo',
        [nombre.trim(), descripcion || null, activo !== undefined ? activo : true, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Prensa no encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error al actualizar prensa:', error);
      res.status(500).json({ error: 'Error al actualizar prensa' });
    }
  });

  /**
   * DELETE /api/prensas/:id
   * Desactivar prensa (soft delete) - solo admin
   */
  router.delete('/:id', authRequired(), async (req: any, res: Response) => {
    const { id } = req.params;

    // Verificar que sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    try {
      const result = await client.query(
        'UPDATE prensas SET activo = false WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Prensa no encontrada' });
      }

      res.json({ message: 'Prensa desactivada correctamente' });
    } catch (error: any) {
      console.error('Error al desactivar prensa:', error);
      res.status(500).json({ error: 'Error al desactivar prensa' });
    }
  });

  return router;
};

