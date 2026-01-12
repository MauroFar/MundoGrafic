import React from 'react';
import { FaLock, FaTimes, FaUserShield } from 'react-icons/fa';

const ModalSinPermisos = ({ isOpen, onClose, accion = 'realizar esta acción', modulo = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-full">
              <FaLock className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Acceso Denegado</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700 text-center font-semibold text-lg">
              No tienes permisos para modificar datos
            </p>
          </div>

          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <FaUserShield className="text-blue-600 text-xl mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700">
                Contacta al administrador del sistema para obtener los permisos necesarios.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSinPermisos;
