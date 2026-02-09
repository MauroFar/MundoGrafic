import express from 'express';
import authRequired from '../middleware/auth';
import checkAdminRole from '../middleware/checkAdminRole';

const router = express.Router();

export default (client: any) => {
  // ===== ENDPOINTS PÚBLICOS (para llenar dropdowns) =====
  
  // Obtener todos los roles activos (usado en formularios)
  router.get('/', authRequired(), async (req: any, res: any) => {
    try {
      const result = await client.query(
        'SELECT id, nombre, descripcion FROM roles WHERE activo = TRUE ORDER BY nombre'
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error obteniendo roles:', error);
      res.status(500).json({ error: 'Error obteniendo roles', details: error.message });
    }
  });

  // ===== ENDPOINTS DE ADMINISTRACIÓN (solo admin) =====
  
  // Obtener TODOS los roles (incluyendo inactivos) - para gestión
  router.get('/all', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const result = await client.query(
        'SELECT id, nombre, descripcion, es_sistema, activo, creado_en, actualizado_en FROM roles ORDER BY id'
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error obteniendo todos los roles:', error);
      res.status(500).json({ error: 'Error obteniendo roles', details: error.message });
    }
  });

  // Obtener un rol por ID
  router.get('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const result = await client.query(
        'SELECT id, nombre, descripcion, es_sistema, activo FROM roles WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error obteniendo rol:', error);
      res.status(500).json({ error: 'Error obteniendo rol', details: error.message });
    }
  });

  // Crear un nuevo rol
  router.post('/', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { nombre, descripcion = '' } = req.body;
      
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre del rol es requerido' });
      }

      // Verificar que no exista un rol con el mismo nombre
      const existente = await client.query(
        'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1)',
        [nombre.trim()]
      );

      if (existente.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
      }

      const result = await client.query(
        'INSERT INTO roles (nombre, descripcion, es_sistema, activo) VALUES ($1, $2, FALSE, TRUE) RETURNING id, nombre, descripcion, es_sistema, activo',
        [nombre.trim(), descripcion.trim()]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creando rol:', error);
      res.status(500).json({ error: 'Error creando rol', details: error.message });
    }
  });

  // Actualizar un rol
  router.put('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, activo } = req.body;

      // Verificar que el rol existe y obtener info
      const rolActual = await client.query('SELECT es_sistema, nombre FROM roles WHERE id = $1', [id]);
      
      if (rolActual.rows.length === 0) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      // No permitir cambiar nombre de roles del sistema
      if (rolActual.rows[0].es_sistema && nombre && nombre !== rolActual.rows[0].nombre) {
        return res.status(400).json({ error: 'No se puede cambiar el nombre de un rol del sistema' });
      }

      // Verificar nombre único si se está cambiando
      if (nombre && nombre !== rolActual.rows[0].nombre) {
        const existente = await client.query(
          'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND id != $2',
          [nombre.trim(), id]
        );

        if (existente.rows.length > 0) {
          return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
        }
      }

      const result = await client.query(
        'UPDATE roles SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), activo = COALESCE($3, activo) WHERE id = $4 RETURNING id, nombre, descripcion, es_sistema, activo',
        [nombre?.trim(), descripcion?.trim(), activo, id]
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error actualizando rol:', error);
      res.status(500).json({ error: 'Error actualizando rol', details: error.message });
    }
  });

  // Eliminar un rol (soft delete - marcar como inactivo)
  router.delete('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    try {
      const { id } = req.params;

      // Verificar que el rol existe
      const rolActual = await client.query('SELECT es_sistema, nombre FROM roles WHERE id = $1', [id]);
      
      if (rolActual.rows.length === 0) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      // No permitir eliminar roles del sistema
      if (rolActual.rows[0].es_sistema) {
        return res.status(400).json({ error: 'No se puede eliminar un rol del sistema' });
      }

      // Verificar que no haya usuarios usando este rol
      const usuariosConRol = await client.query(
        'SELECT COUNT(*) as total FROM usuarios WHERE rol_id = $1',
        [id]
      );

      if (parseInt(usuariosConRol.rows[0].total) > 0) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el rol porque hay usuarios asignados a él',
          usuarios_afectados: usuariosConRol.rows[0].total
        });
      }

      // Soft delete - marcar como inactivo
      await client.query('UPDATE roles SET activo = FALSE WHERE id = $1', [id]);

      res.json({ message: 'Rol eliminado correctamente' });
    } catch (error: any) {
      console.error('Error eliminando rol:', error);
      res.status(500).json({ error: 'Error eliminando rol', details: error.message });
    }
  });

  return router;
};
