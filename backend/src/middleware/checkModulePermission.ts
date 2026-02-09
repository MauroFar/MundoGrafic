/**
 * Middleware para verificar si el usuario tiene permisos de lectura en un módulo específico
 * Esto permite que usuarios no-admin puedan acceder a interfaces si tienen permisos asignados
 */

export default (client: any, modulo: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        console.log(`❌ [checkModulePermission] No hay usuario en el token`);
        return res.status(401).json({ error: 'No autorizado' });
      }

      console.log(`🔍 [checkModulePermission] Verificando acceso a módulo "${modulo}" para usuario ID: ${userId}`);

      // Verificar si es admin desde el JWT primero
      if (req.user?.rol === 'admin') {
        console.log(`✅ [checkModulePermission] Usuario es admin (desde JWT) - Acceso total a "${modulo}"`);
        return next();
      }

      // Verificar si es admin desde la base de datos (campo rol o rol_id)
      const adminCheck = await client.query(
        `SELECT u.rol, r.es_sistema, r.nombre as rol_nombre
         FROM usuarios u
         LEFT JOIN roles r ON u.rol_id = r.id
         WHERE u.id = $1 AND u.activo = true`,
        [userId]
      );

      if (adminCheck.rows.length > 0) {
        const userData = adminCheck.rows[0];
        if (userData.rol === 'admin' || userData.es_sistema === true) {
          console.log(`✅ [checkModulePermission] Usuario es admin - Acceso total a "${modulo}"`);
          return next();
        }
      }

      // Si no es admin, verificar permisos CRUD del módulo
      const permisosResult = await client.query(
        `SELECT puede_leer, puede_crear, puede_editar, puede_eliminar
         FROM usuarios_permisos
         WHERE usuario_id = $1 AND modulo = $2`,
        [userId, modulo]
      );

      console.log(`📊 [checkModulePermission] Permisos encontrados:`, permisosResult.rows);

      if (permisosResult.rows.length === 0) {
        console.log(`❌ [checkModulePermission] Sin permisos configurados para módulo "${modulo}"`);
        return res.status(403).json({ 
          error: 'No tienes permisos para acceder a este módulo',
          modulo 
        });
      }

      const permisos = permisosResult.rows[0];

      // Permitir acceso si tiene al menos permiso de lectura
      if (permisos.puede_leer === true) {
        console.log(`✅ [checkModulePermission] Usuario tiene permiso de lectura en "${modulo}"`);
        // Adjuntar permisos al request para que las rutas puedan usarlos
        req.modulePermissions = permisos;
        return next();
      }

      console.log(`❌ [checkModulePermission] Usuario NO tiene permiso de lectura en "${modulo}"`);
      return res.status(403).json({ 
        error: 'No tienes permisos de lectura en este módulo',
        modulo 
      });

    } catch (error: any) {
      console.error(`❌ [checkModulePermission] Error:`, error);
      return res.status(500).json({ error: 'Error verificando permisos', details: error.message });
    }
  };
};
