const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'TU_SECRETO';

function authRequired(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - Authorization header:', authHeader);
    if (!authHeader) {
      console.log('Auth middleware - Token requerido');
      return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = payload;
      console.log('Auth middleware - Token válido, payload:', payload);
      if (roles.length && !roles.includes(payload.rol)) {
        console.log('Auth middleware - Acceso denegado para rol:', payload.rol);
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      next();
    } catch (err) {
      console.log('Auth middleware - Token inválido:', err.message);
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

module.exports = authRequired; 