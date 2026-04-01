import React, { createContext, useContext, useEffect, useState } from 'react';
import ModalSinPermisos from '../components/ModalSinPermisos';
import { buildPermissionDeniedMessage } from '../config/permissionMessages';

const PermisosContext = createContext();

export const usePermisosContext = () => {
  const context = useContext(PermisosContext);
  if (!context) {
    throw new Error('usePermisosContext debe usarse dentro de PermisosProvider');
  }
  return context;
};

export const PermisosProvider = ({ children }) => {
  const [modalData, setModalData] = useState({
    isOpen: false,
    accion: '',
    modulo: '',
    mensaje: '',
    customActionText: ''
  });

  const mostrarModalSinPermiso = (accion, modulo, mensaje = '', customActionText = '') => {
    const finalMessage = buildPermissionDeniedMessage({
      accion,
      modulo,
      customActionText,
      fallbackMessage: mensaje,
    });

    setModalData({
      isOpen: true,
      accion,
      modulo,
      mensaje: finalMessage,
      customActionText,
    });
  };

  const cerrarModal = () => {
    setModalData({ isOpen: false, accion: '', modulo: '', mensaje: '', customActionText: '' });
  };

  useEffect(() => {
    const onPermissionDenied = (event) => {
      const detail = event?.detail || {};
      const message = buildPermissionDeniedMessage({
        accion: detail.accion,
        modulo: detail.modulo,
        customActionText: detail.customActionText,
        fallbackMessage: detail.message,
      });
      setModalData((prev) => {
        if (prev.isOpen) return prev;
        return {
          isOpen: true,
          accion: detail.accion || 'realizar',
          modulo: detail.modulo || '',
          mensaje: message,
          customActionText: detail.customActionText || '',
        };
      });
    };

    window.addEventListener('app:permission-denied', onPermissionDenied);

    return () => {
      window.removeEventListener('app:permission-denied', onPermissionDenied);
    };
  }, []);

  return (
    <PermisosContext.Provider value={{ mostrarModalSinPermiso, cerrarModal }}>
      {children}
      
      {/* Modal global - se renderiza una sola vez para toda la aplicación */}
      <ModalSinPermisos 
        isOpen={modalData.isOpen}
        onClose={cerrarModal}
        accion={modalData.accion}
        modulo={modalData.modulo}
        mensaje={modalData.mensaje}
      />
    </PermisosContext.Provider>
  );
};
