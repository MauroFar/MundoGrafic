import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: number;
    rol: string;
  };
}

// Middleware para verificar permisos específicos
export const checkPermission = (client: any, modulo: string, accion: 'crear' | 'leer' | 'editar' | 'eliminar') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const usuario = req.user;

      if (!usuario) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      // Admin tiene todos los permisos
      if (usuario.rol === 'admin') {
        return next();
      }

      // Verificar permiso específico
      const result = await client.query(
        `SELECT puede_${accion} as tiene_permiso 
         FROM usuarios_permisos 
         WHERE usuario_id = $1 AND modulo = $2`,
        [usuario.id, modulo]
      );

      if (result.rows.length === 0 || !result.rows[0].tiene_permiso) {
        return res.status(403).json({ 
          error: 'Permiso denegado',
          message: `No tienes permiso para ${accion} en ${modulo}`
        });
      }

      next();
    } catch (error: any) {
      console.error('Error al verificar permisos:', error);
      res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
};

export default checkPermission;
