import express from 'express';
import authRequired from '../middleware/auth';
import checkAdminRole from '../middleware/checkAdminRole';

const router = express.Router();

export default (client: any) => {
  // ===== ENDPOINTS PÚBLICOS (para llenar dropdowns) =====
  
  // Obtener todas las áreas activas (usado en formularios)
  router.get('/', authRequired(), async (req: any, res: any) => {
    try {
      const result = await client.query(
        'SELECT id, nombre, descripcion FROM areas WHERE activo = TRUE ORDER BY nombre'
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error obteniendo áreas:', error);
      res.status(500).json({ error: 'Error obteniendo áreas', details: error.message });
    }
  });

  // ===== ENDPOINTS DE ADMINISTRACIÓN (solo admin) =====
  
  // Obtener TODAS las áreas (incluyendo inactivas) - para gestión
  router.get('/all', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const result = await client.query(
        'SELECT id, nombre, descripcion, activo, creado_en, actualizado_en FROM areas ORDER BY id'
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error obteniendo todas las áreas:', error);
      res.status(500).json({ error: 'Error obteniendo áreas', details: error.message });
    }
  });

  // Obtener un área por ID
  router.get('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const result = await client.query(
        'SELECT id, nombre, descripcion, activo FROM areas WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Área no encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error obteniendo área:', error);
      res.status(500).json({ error: 'Error obteniendo área', details: error.message });
    }
  });

  // Crear una nueva área
  router.post('/', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { nombre, descripcion = '' } = req.body;
      
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre del área es requerido' });
      }

      // Verificar que no exista un área con el mismo nombre
      const existente = await client.query(
        'SELECT id FROM areas WHERE LOWER(nombre) = LOWER($1)',
        [nombre.trim()]
      );

      if (existente.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
      }

      const result = await client.query(
        'INSERT INTO areas (nombre, descripcion, activo) VALUES ($1, $2, TRUE) RETURNING id, nombre, descripcion, activo',
        [nombre.trim(), descripcion.trim()]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creando área:', error);
      res.status(500).json({ error: 'Error creando área', details: error.message });
    }
  });

  // Actualizar un área
  router.put('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, activo } = req.body;

      // Verificar que el área existe
      const areaActual = await client.query('SELECT nombre FROM areas WHERE id = $1', [id]);
      
      if (areaActual.rows.length === 0) {
        return res.status(404).json({ error: 'Área no encontrada' });
      }

      // Verificar nombre único si se está cambiando
      if (nombre && nombre !== areaActual.rows[0].nombre) {
        const existente = await client.query(
          'SELECT id FROM areas WHERE LOWER(nombre) = LOWER($1) AND id != $2',
          [nombre.trim(), id]
        );

        if (existente.rows.length > 0) {
          return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
        }
      }

      const result = await client.query(
        'UPDATE areas SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), activo = COALESCE($3, activo) WHERE id = $4 RETURNING id, nombre, descripcion, activo',
        [nombre?.trim(), descripcion?.trim(), activo, id]
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error actualizando área:', error);
      res.status(500).json({ error: 'Error actualizando área', details: error.message });
    }
  });

  // Eliminar un área (soft delete - marcar como inactivo)
  router.delete('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { id } = req.params;

      // Verificar que el área existe
      const areaActual = await client.query('SELECT nombre FROM areas WHERE id = $1', [id]);
      
      if (areaActual.rows.length === 0) {
        return res.status(404).json({ error: 'Área no encontrada' });
      }

      // Verificar que no haya usuarios usando esta área
      const usuariosConArea = await client.query(
        'SELECT COUNT(*) as total FROM usuarios WHERE area_id = $1',
        [id]
      );

      if (parseInt(usuariosConArea.rows[0].total) > 0) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el área porque hay usuarios asignados a ella',
          usuarios_afectados: usuariosConArea.rows[0].total
        });
      }

      // Soft delete - marcar como inactivo
      await client.query('UPDATE areas SET activo = FALSE WHERE id = $1', [id]);

      res.json({ message: 'Área eliminada correctamente' });
    } catch (error: any) {
      console.error('Error eliminando área:', error);
      res.status(500).json({ error: 'Error eliminando área', details: error.message });
    }
  });

  return router;
}; 