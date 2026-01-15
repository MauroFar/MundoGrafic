import express from "express";
const router = express.Router();
import bcrypt from "bcryptjs";
import authRequired from "../middleware/auth";

export default (client: any) => {
  // Listar todos los usuarios (acceso para cualquier usuario autenticado)
  router.get('/', authRequired(), async (req: any, res: any) => {
    console.log('Usuario autenticado:', req.user);
    const result = await client.query('SELECT id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular, es_empleado_mundografic FROM usuarios');
    console.log('Usuarios encontrados:', result.rows);
    res.json(result.rows);
  });

  // Listar solo empleados de MundoGrafic activos (para selección de equipo)
  router.get('/empleados-mundografic', authRequired(), async (req: any, res: any) => {
    const result = await client.query(
      'SELECT id, email, nombre, rol, area_id FROM usuarios WHERE es_empleado_mundografic = true AND activo = true ORDER BY nombre'
    );
    res.json(result.rows);
  });

  // Crear usuario (solo admin)
  router.post('/', authRequired(['admin']), async (req: any, res: any) => {
    const { email, nombre_usuario, password, nombre, rol, area_id, email_personal, celular, es_empleado_mundografic } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      
      // Generar email_config automáticamente para ejecutivos
      let email_config = 'main'; // Por defecto
      if (rol === 'ejecutivo' && email_personal) {
        // Extraer el nombre del email personal (ej: henry@gmail.com -> henry)
        const emailName = email_personal.split('@')[0];
        email_config = emailName.toLowerCase();
      }
      
      // Determinar si es empleado de MundoGrafic (por defecto según rol)
      const esEmpleado = es_empleado_mundografic !== undefined 
        ? es_empleado_mundografic 
        : ['admin', 'ejecutivo', 'empleado', 'gerente'].includes(rol);
      
      const result = await client.query(
        'INSERT INTO usuarios (email, nombre_usuario, password_hash, nombre, rol, area_id, email_personal, email_config, celular, es_empleado_mundografic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular, es_empleado_mundografic',
        [email, nombre_usuario, hash, nombre, rol, area_id, email_personal, email_config, celular || null, esEmpleado]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Editar usuario (solo admin)
  router.put('/:id', authRequired(['admin']), async (req: any, res: any) => {
    const { id } = req.params;
    const { email, nombre_usuario, nombre, rol, area_id, activo, password, email_personal, celular, es_empleado_mundografic } = req.body;
    try {
      // Generar email_config automáticamente para ejecutivos
      let email_config = 'main'; // Por defecto
      if (rol === 'ejecutivo' && email_personal) {
        // Extraer el nombre del email personal (ej: henry@gmail.com -> henry)
        const emailName = email_personal.split('@')[0];
        email_config = emailName.toLowerCase();
      }
      
      // Determinar si es empleado de MundoGrafic
      const esEmpleado = es_empleado_mundografic !== undefined 
        ? es_empleado_mundografic 
        : ['admin', 'ejecutivo', 'empleado', 'gerente'].includes(rol);
      
      let query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, area_id = $5, activo = $6, email_personal = $7, email_config = $8, celular = $9, es_empleado_mundografic = $10';
      let params = [email, nombre_usuario, nombre, rol, area_id, activo, email_personal, email_config, celular || null, esEmpleado, id];
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, area_id = $5, activo = $6, email_personal = $7, email_config = $8, celular = $9, es_empleado_mundografic = $10, password_hash = $11 WHERE id = $12 RETURNING id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular, es_empleado_mundografic';
        params = [email, nombre_usuario, nombre, rol, area_id, activo, email_personal, email_config, celular || null, esEmpleado, hash, id];
      } else {
        query += ' WHERE id = $11 RETURNING id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular, es_empleado_mundografic';
      }
      const result = await client.query(query, params);
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Borrar usuario (solo admin)
  router.delete('/:id', authRequired(['admin']), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Actualizar firma de usuario (solo admin)
  router.put('/:id/firma', authRequired(['admin']), async (req: any, res: any) => {
    const { id } = req.params;
    const { firma_html, firma_activa } = req.body;
    try {
      const result = await client.query(
        'UPDATE usuarios SET firma_html = $1, firma_activa = $2 WHERE id = $3 RETURNING id, nombre, firma_html, firma_activa',
        [firma_html, firma_activa, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Obtener firma de usuario
  router.get('/:id/firma', authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const result = await client.query(
        'SELECT id, nombre, firma_html, firma_activa FROM usuarios WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  return router;
}; 