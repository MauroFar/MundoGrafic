import express from "express";
const router = express.Router();
import bcrypt from "bcryptjs";
import authRequired from "../middleware/auth";
import checkModulePermission from "../middleware/checkModulePermission";
import checkPermission from "../middleware/checkPermission";
import { getCrudModuleIds } from "../config/permissionCatalog";

export default (client: any) => {
  const normalizeAreaIds = (areaIdsInput: any, areaIdInput: any) => {
    const fromArray = Array.isArray(areaIdsInput) ? areaIdsInput : [];
    const merged = [areaIdInput, ...fromArray]
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    return Array.from(new Set(merged));
  };

  const syncUserAreas = async (usuarioId: number, areaIds: number[]) => {
    await client.query('DELETE FROM usuarios_areas WHERE usuario_id = $1', [usuarioId]);

    for (let index = 0; index < areaIds.length; index += 1) {
      const areaId = areaIds[index];
      await client.query(
        `INSERT INTO usuarios_areas (usuario_id, area_id, es_principal, updated_at)
         VALUES ($1, $2, $3, NOW())`,
        [usuarioId, areaId, index === 0]
      );
    }

    await client.query('UPDATE usuarios SET area_id = $1 WHERE id = $2', [areaIds[0], usuarioId]);
  };

  // Listar todos los usuarios (requiere permiso de lectura en módulo 'usuarios')
  router.get('/', authRequired(), checkModulePermission(client, 'usuarios'), async (req: any, res: any) => {
    console.log('Usuario autenticado:', req.user);
    const result = await client.query(`
      SELECT
        u.id,
        u.email,
        u.nombre_usuario,
        u.nombre,
        u.rol,
        u.area_id,
        u.activo,
        u.fecha_creacion,
        u.firma_html,
        u.firma_activa,
        u.email_personal,
        u.email_config,
        u.celular,
        COALESCE(
          ARRAY_REMOVE(
            ARRAY_AGG(DISTINCT ua.area_id) FILTER (WHERE ua.area_id IS NOT NULL),
            NULL
          ),
          ARRAY[]::INTEGER[]
        ) AS area_ids
      FROM usuarios u
      LEFT JOIN usuarios_areas ua ON ua.usuario_id = u.id
      GROUP BY
        u.id,
        u.email,
        u.nombre_usuario,
        u.nombre,
        u.rol,
        u.area_id,
        u.activo,
        u.fecha_creacion,
        u.firma_html,
        u.firma_activa,
        u.email_personal,
        u.email_config,
        u.celular
      ORDER BY u.id ASC
    `);
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

  // Crear usuario (requiere permiso crear en modulo usuarios)
  router.post('/', authRequired(), checkPermission(client, 'usuarios', 'crear'), async (req: any, res: any) => {
    const { email, nombre_usuario, password, nombre, rol, area_id, area_ids, email_personal, celular } = req.body;
    try {
      const normalizedAreaIds = normalizeAreaIds(area_ids, area_id);
      if (normalizedAreaIds.length === 0) {
        return res.status(400).json({ error: 'Debe seleccionar al menos un area' });
      }

      const primaryAreaId = normalizedAreaIds[0];
      const hash = await bcrypt.hash(password, 10);
      
      // Obtener rol_id desde la tabla roles basándose en el nombre
      const rolResult = await client.query(
        'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND activo = true',
        [rol]
      );
      
      const rol_id = rolResult.rows.length > 0 ? rolResult.rows[0].id : null;
      
      // Generar email_config automáticamente basado en el nombre del usuario
      let email_config = 'MAIN'; // Fallback por defecto
      
      if (nombre) {
        // Tomar el primer nombre o la primera parte antes del espacio
        const primerNombre = nombre.trim().split(' ')[0];
        // Convertir a mayúsculas y remover caracteres especiales
        email_config = primerNombre
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/[^A-Z0-9]/g, '_'); // Reemplazar caracteres no alfanuméricos con _
      } else if (email_personal) {
        // Si no hay nombre, usar el email personal
        const emailName = email_personal.split('@')[0];
        email_config = emailName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      }
      
      console.log(`📧 Generando email_config para '${nombre}': ${email_config}`);
      
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO usuarios (email, nombre_usuario, password_hash, nombre, rol, rol_id, area_id, email_personal, email_config, celular) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, nombre_usuario, nombre, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular',
        [email, nombre_usuario, hash, nombre, rol, rol_id, primaryAreaId, email_personal, email_config, celular || null]
      );
      
      // Crear permisos iniciales denegados para el nuevo usuario
      const newUserId = result.rows[0].id;
      const modulos = getCrudModuleIds();
      
      for (const modulo of modulos) {
        await client.query(
          'INSERT INTO usuarios_permisos (usuario_id, modulo, puede_crear, puede_leer, puede_editar, puede_eliminar) VALUES ($1, $2, false, false, false, false) ON CONFLICT (usuario_id, modulo) DO NOTHING',
          [newUserId, modulo]
        );
      }

      await syncUserAreas(newUserId, normalizedAreaIds);
      await client.query('COMMIT');
      
      console.log(`✅ Permisos iniciales (denegados) creados para usuario ID: ${newUserId}`);
      
      res.json(result.rows[0]);
    } catch (err: any) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Editar usuario (requiere permiso editar en modulo usuarios)
  router.put('/:id', authRequired(), checkPermission(client, 'usuarios', 'editar'), async (req: any, res: any) => {
    const { id } = req.params;
    const { email, nombre_usuario, nombre, rol, area_id, area_ids, activo, password, email_personal, celular } = req.body;
    try {
      const normalizedAreaIds = normalizeAreaIds(area_ids, area_id);
      if (normalizedAreaIds.length === 0) {
        return res.status(400).json({ error: 'Debe seleccionar al menos un area' });
      }

      const primaryAreaId = normalizedAreaIds[0];

      // Obtener rol_id desde la tabla roles basándose en el nombre
      const rolResult = await client.query(
        'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND activo = true',
        [rol]
      );
      
      const rol_id = rolResult.rows.length > 0 ? rolResult.rows[0].id : null;
      
      // Generar email_config automáticamente basado en el nombre del usuario
      let email_config = 'MAIN'; // Fallback por defecto
      
      if (nombre) {
        // Tomar el primer nombre o la primera parte antes del espacio
        const primerNombre = nombre.trim().split(' ')[0];
        // Convertir a mayúsculas y remover caracteres especiales
        email_config = primerNombre
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/[^A-Z0-9]/g, '_'); // Reemplazar caracteres no alfanuméricos con _
      } else if (email_personal) {
        // Si no hay nombre, usar el email personal
        const emailName = email_personal.split('@')[0];
        email_config = emailName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      }
      
      console.log(`📧 Actualizando email_config para '${nombre}': ${email_config}`);

      await client.query('BEGIN');
      
      let query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, rol_id = $5, area_id = $6, activo = $7, email_personal = $8, email_config = $9, celular = $10';
      let params = [email, nombre_usuario, nombre, rol, rol_id, primaryAreaId, activo, email_personal, email_config, celular || null, id];
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        query = 'UPDATE usuarios SET email = $1, nombre_usuario = $2, nombre = $3, rol = $4, rol_id = $5, area_id = $6, activo = $7, email_personal = $8, email_config = $9, celular = $10, password_hash = $11 WHERE id = $12 RETURNING id, email, nombre_usuario, nombre, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular';
        params = [email, nombre_usuario, nombre, rol, rol_id, primaryAreaId, activo, email_personal, email_config, celular || null, hash, id];
      } else {
        query += ' WHERE id = $11 RETURNING id, email, nombre_usuario, nombre, rol, rol_id, area_id, activo, fecha_creacion, firma_html, firma_activa, email_personal, email_config, celular';
      }
      const result = await client.query(query, params);

      await syncUserAreas(Number(id), normalizedAreaIds);
      await client.query('COMMIT');

      res.json(result.rows[0]);
    } catch (err: any) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Borrar usuario (requiere permiso eliminar en modulo usuarios)
  router.delete('/:id', authRequired(), checkPermission(client, 'usuarios', 'eliminar'), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.detail || err.message });
    }
  });

  // Actualizar firma de usuario (requiere permiso editar en modulo usuarios)
  router.put('/:id/firma', authRequired(), checkPermission(client, 'usuarios', 'editar'), async (req: any, res: any) => {
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
  router.get('/:id/firma', authRequired(), checkPermission(client, 'usuarios', 'leer'), async (req: any, res: any) => {
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