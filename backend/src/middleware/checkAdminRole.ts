import { Request, Response, NextFunction } from 'express';
import { Client } from 'pg';

/**
 * Middleware para verificar si el usuario tiene un rol de sistema (admin)
 * Usa la tabla 'roles' y el campo 'es_sistema' en lugar de hardcodear nombres de roles
 */
function checkAdminRole(client: Client) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      console.log('🔐 [checkAdminRole] Usuario del token:', user);
      
      if (!user || !user.id) {
        console.log('❌ [checkAdminRole] Usuario no autenticado');
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Verificar si el usuario es admin desde el JWT primero
      if (user.rol === 'admin') {
        console.log('✅ [checkAdminRole] Usuario es admin (desde JWT) - Acceso permitido');
        (req as any).user.esAdmin = true;
        (req as any).user.rolNombre = 'admin';
        return next();
      }

      // Consultar si el usuario tiene un rol de sistema (es_sistema = true) desde la base de datos
      console.log('🔍 [checkAdminRole] Consultando rol para usuario ID:', user.id);
      const result = await client.query(`
        SELECT u.rol, r.es_sistema, r.nombre as rol_nombre
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        WHERE u.id = $1 AND u.activo = true
      `, [user.id]);

      console.log('📊 [checkAdminRole] Resultado query:', result.rows);

      if (result.rows.length === 0) {
        console.log('❌ [checkAdminRole] Usuario no encontrado o inactivo:', user.id);
        return res.status(403).json({ 
          error: 'Acceso denegado',
          mensaje: 'Usuario no encontrado o inactivo'
        });
      }

      const userRole = result.rows[0];
      console.log('👤 [checkAdminRole] Rol encontrado:', userRole);

      // Verificar si es admin por el campo 'rol' o si tiene es_sistema = true
      if (userRole.rol === 'admin' || userRole.es_sistema) {
        console.log('✅ [checkAdminRole] Usuario es admin - Acceso permitido');
        (req as any).user.esAdmin = true;
        (req as any).user.rolNombre = userRole.rol_nombre || userRole.rol;
        return next();
      }

      // No es admin
      console.log('❌ [checkAdminRole] Usuario NO es admin - Acceso denegado');
      return res.status(403).json({ 
        error: 'Acceso denegado',
        mensaje: 'Se requiere rol de administrador del sistema'
      });

    } catch (error: any) {
      console.error('Error en checkAdminRole:', error);
      return res.status(500).json({ 
        error: 'Error al verificar permisos de administrador',
        details: error.message 
      });
    }
  };
}

export default checkAdminRole;
