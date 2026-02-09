import express from "express";
const router = express.Router();
import bcrypt from "bcryptjs";
import authRequired from "../middleware/auth";
import checkAdminRole from "../middleware/checkAdminRole";
import checkModulePermission from "../middleware/checkModulePermission";

export default (client: any) => {
  // Listar todos los usuarios (requiere permiso de lectura en módulo 'usuarios')
  router.get('/', authRequired(), checkModulePermission(client, 'usuarios'), async (req: any, res: any) => {
    console.log('Usuario autenticado:', req.user);
    const result = await client.query('SELECT id, email, nombre_usuario, nombre, rol, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular FROM usuarios');
    console.log('Usuarios encontrados:', result.rows);
    res.json(result.rows);
  });

  // Listar usuarios vendedores (para cotizaciones)
  router.get('/vendedores', authRequired(), async (req: any, res: any) => {
    try {
      const result = await client.query(
        'SELECT id, nombre, email, celular FROM usuarios WHERE LOWER(rol) = LOWER($1) AND activo = true ORDER BY nombre',
        ['vendedor']
      );
      console.log('Vendedores encontrados:', result.rows.length);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Crear usuario (solo admin)
  router.post('/', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    const { email, nombre_usuario, password, nombre, rol, area_id, email_personal, celular } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      
      // Obtener rol_id desde la tabla roles basándose en el nombre
      const rolResult = await client.query(
        'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND activo = true',
        [rol]
      );
      
      const rol_id = rolResult.rows.length > 0 ? rolResult.rows[0].id : null;
      
      // Generar email_config automáticamente para ejecutivos
      let email_config = 'main'; // Por defecto
      if (rol === 'ejecutivo' && email_personal) {
        // Extraer el nombre del email personal (ej: henry@gmail.com -> henry)
        const emailName = email_personal.split('@')[0];
        email_config = emailName.toLowerCase();
      }
      
      const result = await client.query(
        'INSERT INTO usuarios (email, nombre_usuario, password_hash, nombre, rol, rol_id, area_id, email_personal, email_config, celular) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, nombre_usuario, nombre, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular',
        [email, nombre_usuario, hash, nombre, rol, rol_id, area_id, email_personal, email_config, celular || null]
      );
      
      // Crear permisos iniciales denegados para el nuevo usuario
      const newUserId = result.rows[0].id;
      const modulos = ['clientes', 'cotizaciones', 'ordenes_trabajo', 'produccion', 'inventario', 'usuarios', 'reportes'];
      
      for (const modulo of modulos) {
        await client.query(
          'INSERT INTO usuarios_permisos (usuario_id, modulo, puede_crear, puede_leer, puede_editar, puede_eliminar) VALUES ($1, $2, false, false, false, false) ON CONFLICT (usuario_id, modulo) DO NOTHING',
          [newUserId, modulo]
        );
      }
      
      console.log(`✅ Permisos iniciales (denegados) creados para usuario ID: ${newUserId}`);
      
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Editar usuario (solo admin)
  router.put('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    const { id } = req.params;
    const { email, nombre_usuario, nombre, rol, area_id, activo, password, email_personal, celular } = req.body;
    try {
      // Obtener rol_id desde la tabla roles basándose en el nombre
      const rolResult = await client.query(
        'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND activo = true',
        [rol]
      );
      
      const rol_id = rolResult.rows.length > 0 ? rolResult.rows[0].id : null;
      
      // Generar email_config automáticamente para ejecutivos
      let email_config = 'main'; // Por defecto
      if (rol === 'ejecutivo' && email_personal) {
        // Extraer el nombre del email personal (ej: henry@gmail.com -> henry)
        const emailName = email_personal.split('@')[0];
        email_config = emailName.toLowerCase();
      }
      
      let query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, rol_id = $5, area_id = $6, activo = $7, email_personal = $8, email_config = $9, celular = $10';
      let params = [email, nombre_usuario, nombre, rol, rol_id, area_id, activo, email_personal, email_config, celular || null, id];
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, rol_id = $5, area_id = $6, activo = $7, email_personal = $8, email_config = $9, celular = $10, password_hash = $11 WHERE id = $12 RETURNING id, email, nombre_usuario, nombre, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular';
        params = [email, nombre_usuario, nombre, rol, rol_id, area_id, activo, email_personal, email_config, celular || null, hash, id];
      } else {
        query += ' WHERE id = $11 RETURNING id, email, nombre_usuario, nombre, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular';
      }
      const result = await client.query(query, params);
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Borrar usuario (solo admin)
  router.delete('/:id', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Actualizar firma de usuario (solo admin)
  router.put('/:id/firma', authRequired(), checkAdminRole(client), async (req: any, res: any) => {
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