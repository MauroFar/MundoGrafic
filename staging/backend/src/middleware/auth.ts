import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET = process.env.JWT_SECRET || 'TU_SECRETO';

function authRequired(roles: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - Authorization header:', authHeader);
    if (!authHeader) {
      console.log('Auth middleware - Token requerido');
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, SECRET as string);
      req.user = payload;
      console.log('Auth middleware - Token válido, payload:', payload);
      if (roles.length && !roles.includes((payload as any).rol)) {
        console.log('Auth middleware - Acceso denegado para rol:', (payload as any).rol);
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      next();
    } catch (err: any) {
      console.log('Auth middleware - Token inválido:', err.message);
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

export default authRequired; 