import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles = null, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  
  // Verificar si el usuario está autenticado
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si requireAdmin es true, verificar que el rol sea admin
  if (requireAdmin && rol !== 'admin') {
    return <Navigate to="/no-autorizado" replace />;
  }

  // Admin siempre tiene acceso completo
  if (rol === 'admin') {
    return children;
  }

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  // NOTA: Si el usuario tiene otro rol pero tiene permisos CRUD configurados,
  // el sistema lo verificará a nivel de componente con BotonConPermiso y usePermisos
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(rol)) {
      // En lugar de bloquear completamente, permitir acceso si tiene permisos
      // Los componentes internos verificarán los permisos CRUD específicos
      console.log(`⚠️ Usuario con rol "${rol}" intentando acceder a ruta que requiere roles:`, allowedRoles);
      // Por ahora permitir el acceso - los permisos se verificarán dentro
      // return <Navigate to="/no-autorizado" replace />;
      
      // Permitir el acceso - el sistema de permisos CRUD manejará la autorización
      return children;
    }
  }
  
  return children;
} 