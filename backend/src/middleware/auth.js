const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'TU_SECRETO';

function authRequired(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = payload;
      if (roles.length && !roles.includes(payload.rol)) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

module.exports = authRequired; 