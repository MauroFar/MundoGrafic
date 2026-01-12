import { useState, useEffect } from 'react';
import { usePermisosContext } from '../context/PermisosContext';

export const usePermisos = () => {
  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);
  const { mostrarModalSinPermiso, cerrarModal } = usePermisosContext();
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    cargarPermisos();
  }, []);

  const cargarPermisos = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/permisos/mis-permisos/actual`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const permisosMap = {};
        
        data.forEach(p => {
          permisosMap[p.modulo] = {
            puede_crear: p.puede_crear,
            puede_leer: p.puede_leer,
            puede_editar: p.puede_editar,
            puede_eliminar: p.puede_eliminar
          };
        });

        setPermisos(permisosMap);
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const tienePermiso = (modulo, accion) => {
    // Admin tiene todos los permisos
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol === 'admin') {
      return true;
    }

    const permisoModulo = permisos[modulo];
    if (!permisoModulo) return false;

    return permisoModulo[`puede_${accion}`] || false;
  };

  const puedeCrear = (modulo) => tienePermiso(modulo, 'crear');
  const puedeLeer = (modulo) => tienePermiso(modulo, 'leer');
  const puedeEditar = (modulo) => tienePermiso(modulo, 'editar');
  const puedeEliminar = (modulo) => tienePermiso(modulo, 'eliminar');

  // Funciones con validación y modal usando el contexto global
  const verificarYMostrarError = (modulo, accion, nombreAccion) => {
    if (!tienePermiso(modulo, accion)) {
      mostrarModalSinPermiso(nombreAccion, modulo);
      return false;
    }
    return true;
  };

  return {
    permisos,
    loading,
    tienePermiso,
    puedeCrear,
    puedeLeer,
    puedeEditar,
    puedeEliminar,
    recargarPermisos: cargarPermisos,
    cerrarModal,
    verificarYMostrarError
  };
};
