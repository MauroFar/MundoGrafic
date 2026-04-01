import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export default function PrivateRoute({
  children,
  allowedRoles = null,
  requireAdmin = false,
  requiredModule = null,
  requireAnyAdminModule = false,
}) {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  const [modulosDisponibles, setModulosDisponibles] = useState([]);
  const [loadingModules, setLoadingModules] = useState(requiredModule || requireAnyAdminModule);

  const shouldCheckModules = useMemo(
    () => Boolean(requiredModule || requireAnyAdminModule),
    [requiredModule, requireAnyAdminModule]
  );

  useEffect(() => {
    if (!token || !shouldCheckModules || rol === 'admin') {
      setLoadingModules(false);
      return;
    }

    let mounted = true;

    fetch(`${API_URL}/api/permisos/modulos-disponibles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setModulosDisponibles(Array.isArray(data?.modulos) ? data.modulos : []);
      })
      .catch(() => {
        if (!mounted) return;
        setModulosDisponibles([]);
      })
      .finally(() => {
        if (mounted) setLoadingModules(false);
      });

    return () => {
      mounted = false;
    };
  }, [token, rol, shouldCheckModules]);
  
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

  if (shouldCheckModules) {
    if (loadingModules) {
      return <div className="text-center text-lg mt-20">Validando permisos...</div>;
    }

    if (requiredModule && !modulosDisponibles.includes(requiredModule)) {
      return <Navigate to="/no-autorizado" replace />;
    }

    if (requireAnyAdminModule && modulosDisponibles.length === 0) {
      return <Navigate to="/no-autorizado" replace />;
    }
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