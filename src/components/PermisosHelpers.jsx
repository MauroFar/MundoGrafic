import React from 'react';
import { usePermisos } from '../hooks/usePermisos';

/**
 * Higher Order Component para proteger componentes completos con permisos
 * 
 * @param {Component} Component - Componente a proteger
 * @param {string} modulo - Módulo requerido
 * @param {string} accion - Acción requerida ('crear', 'editar', 'eliminar', 'leer')
 * @param {Component} Fallback - Componente a mostrar si no tiene permiso (opcional)
 * 
 * @example
 * const ClientesCrearProtegido = conPermiso(ClientesCrear, 'clientes', 'crear');
 */
export const conPermiso = (Component, modulo, accion, Fallback = null) => {
  return (props) => {
    const { tienePermiso } = usePermisos();

    if (!tienePermiso(modulo, accion)) {
      if (Fallback) {
        return <Fallback />;
      }
      return null;
    }

    return <Component {...props} />;
  };
};

/**
 * Componente wrapper para proteger secciones de la UI
 * 
 * @param {Object} props
 * @param {string} props.modulo - Módulo a verificar
 * @param {string} props.accion - Acción requerida
 * @param {ReactNode} props.children - Contenido a mostrar si tiene permiso
 * @param {ReactNode} props.fallback - Contenido a mostrar si NO tiene permiso (opcional)
 * 
 * @example
 * <ProtegidoPorPermiso modulo="clientes" accion="crear">
 *   <button>Crear Cliente</button>
 * </ProtegidoPorPermiso>
 */
export const ProtegidoPorPermiso = ({ modulo, accion, children, fallback = null }) => {
  const { tienePermiso } = usePermisos();

  if (!tienePermiso(modulo, accion)) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Hook personalizado para validar y ejecutar acciones con permisos
 * 
 * @param {string} modulo - Módulo a verificar
 * @param {string} accion - Acción a verificar
 * @param {string} textoAccion - Texto descriptivo de la acción
 * 
 * @returns {Function} Función que ejecuta la acción si tiene permiso
 * 
 * @example
 * const ejecutarConPermiso = useAccionConPermiso('clientes', 'eliminar', 'eliminar este cliente');
 * 
 * const handleEliminar = () => {
 *   ejecutarConPermiso(() => {
 *     // Tu lógica de eliminación aquí
 *     eliminarCliente(id);
 *   });
 * };
 */
export const useAccionConPermiso = (modulo, accion, textoAccion) => {
  const { verificarYMostrarError } = usePermisos();

  return (callback) => {
    if (verificarYMostrarError(modulo, accion, textoAccion)) {
      callback();
    }
  };
};
