import React from 'react';
import { usePermisos } from '../hooks/usePermisos';
import ModalSinPermisos from './ModalSinPermisos';

/**
 * Componente reutilizable para botones con validación de permisos
 * 
 * @param {Object} props
 * @param {string} props.modulo - Módulo a verificar (ej: 'clientes', 'cotizaciones')
 * @param {string} props.accion - Acción requerida ('crear', 'editar', 'eliminar', 'leer')
 * @param {Function} props.onClick - Función a ejecutar cuando el usuario tiene permiso
 * @param {string} props.className - Clases CSS del botón
 * @param {ReactNode} props.children - Contenido del botón
 * @param {string} props.textoError - Texto personalizado para el modal de error (opcional)
 * @param {boolean} props.disabled - Deshabilitar el botón (opcional)
 * @param {string} props.type - Tipo del botón (button, submit, reset)
 */
const BotonConPermiso = ({ 
  modulo, 
  accion, 
  onClick, 
  className = '', 
  children, 
  textoError,
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const { verificarYMostrarError, modalData, cerrarModal, tienePermiso } = usePermisos();

  // Si no tiene permiso, no renderizar el botón
  if (!tienePermiso(modulo, accion)) {
    return null;
  }

  const handleClick = (e) => {
    // Verificar permisos antes de ejecutar la acción
    const textoAccion = textoError || `${accion} este elemento`;
    
    if (!verificarYMostrarError(modulo, accion, textoAccion)) {
      return;
    }

    // Si tiene permiso, ejecutar la función onClick
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <button
        type={type}
        className={className}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>

      {/* Modal de sin permisos */}
      <ModalSinPermisos 
        isOpen={modalData.isOpen}
        onClose={cerrarModal}
        accion={modalData.accion}
        modulo={modalData.modulo}
      />
    </>
  );
};

export default BotonConPermiso;
