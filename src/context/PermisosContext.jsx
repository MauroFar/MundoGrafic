import React, { createContext, useContext, useState } from 'react';
import ModalSinPermisos from '../components/ModalSinPermisos';

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
    modulo: ''
  });

  const mostrarModalSinPermiso = (accion, modulo) => {
    setModalData({ isOpen: true, accion, modulo });
  };

  const cerrarModal = () => {
    setModalData({ isOpen: false, accion: '', modulo: '' });
  };

  return (
    <PermisosContext.Provider value={{ mostrarModalSinPermiso, cerrarModal }}>
      {children}
      
      {/* Modal global - se renderiza una sola vez para toda la aplicación */}
      <ModalSinPermisos 
        isOpen={modalData.isOpen}
        onClose={cerrarModal}
        accion={modalData.accion}
        modulo={modalData.modulo}
      />
    </PermisosContext.Provider>
  );
};
