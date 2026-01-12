import express from "express";
const router = express.Router();
import authRequired from "../middleware/auth";

export default (client: any) => {
  // Obtener permisos de un usuario
  router.get('/:usuarioId', authRequired(['admin']), async (req: any, res: any) => {
    const { usuarioId } = req.params;
    
    try {
      const result = await client.query(
        'SELECT * FROM usuarios_permisos WHERE usuario_id = $1 ORDER BY modulo',
        [usuarioId]
      );
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al obtener permisos', details: error.message });
    }
  });

  // Obtener permisos del usuario autenticado
  router.get('/mis-permisos/actual', authRequired(), async (req: any, res: any) => {
    const usuarioId = req.user?.id;
    
    try {
      const result = await client.query(
        'SELECT * FROM usuarios_permisos WHERE usuario_id = $1',
        [usuarioId]
      );
      
      // Si es admin, dar todos los permisos
      if (req.user?.rol === 'admin') {
        const modulos = ['clientes', 'cotizaciones', 'ordenes_trabajo', 'produccion', 'inventario', 'usuarios', 'reportes'];
        const permisosAdmin = modulos.map(modulo => ({
          modulo,
          puede_crear: true,
          puede_leer: true,
          puede_editar: true,
          puede_eliminar: true
        }));
        return res.json(permisosAdmin);
      }
      
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al obtener permisos', details: error.message });
    }
  });

  // Actualizar permisos de un usuario
  router.put('/:usuarioId', authRequired(['admin']), async (req: any, res: any) => {
    const { usuarioId } = req.params;
    const { permisos } = req.body; // Array de { modulo, puede_crear, puede_leer, puede_editar, puede_eliminar }
    
    try {
      await client.query('BEGIN');

      // Eliminar permisos anteriores del usuario
      await client.query('DELETE FROM usuarios_permisos WHERE usuario_id = $1', [usuarioId]);

      // Insertar nuevos permisos
      for (const permiso of permisos) {
        await client.query(`
          INSERT INTO usuarios_permisos 
          (usuario_id, modulo, puede_crear, puede_leer, puede_editar, puede_eliminar, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          usuarioId,
          permiso.modulo,
          permiso.puede_crear || false,
          permiso.puede_leer || false,
          permiso.puede_editar || false,
          permiso.puede_eliminar || false
        ]);
      }

      await client.query('COMMIT');
      
      res.json({ message: 'Permisos actualizados exitosamente' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Error al actualizar permisos', details: error.message });
    }
  });

  // Verificar si el usuario tiene un permiso específico
  router.post('/verificar', authRequired(), async (req: any, res: any) => {
    const { modulo, accion } = req.body; // accion: 'crear', 'leer', 'editar', 'eliminar'
    const usuarioId = req.user?.id;
    
    try {
      // Admin tiene todos los permisos
      if (req.user?.rol === 'admin') {
        return res.json({ tiene_permiso: true });
      }

      const result = await client.query(
        `SELECT puede_${accion} as tiene_permiso 
         FROM usuarios_permisos 
         WHERE usuario_id = $1 AND modulo = $2`,
        [usuarioId, modulo]
      );

      if (result.rows.length === 0) {
        return res.json({ tiene_permiso: false });
      }

      res.json({ tiene_permiso: result.rows[0].tiene_permiso });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al verificar permiso', details: error.message });
    }
  });

  return router;
};
