import React from 'react';
import { FaExclamationTriangle, FaTimes, FaFileInvoice, FaTools } from 'react-icons/fa';

const ModalNoSePuedeEliminar = ({ isOpen, onClose, clienteNombre, detalles }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <FaExclamationTriangle className="text-orange-600 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">No se puede eliminar</h2>
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700 font-semibold mb-2">
              El cliente <span className="text-orange-700">"{clienteNombre}"</span> tiene registros asociados y no puede ser eliminado.
            </p>
            <p className="text-sm text-gray-600">
              Para mantener la integridad de los datos del sistema, no es posible eliminar clientes con cotizaciones u órdenes de trabajo activas.
            </p>
          </div>

          {/* Información de registros asociados */}
          {detalles && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-3">Registros asociados:</p>
              <div className="space-y-2">
                {detalles.cotizaciones > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaFileInvoice className="text-blue-600" />
                    <span className="text-gray-700">
                      <strong>{detalles.cotizaciones}</strong> {detalles.cotizaciones === 1 ? 'cotización' : 'cotizaciones'}
                    </span>
                  </div>
                )}
                {detalles.ordenes > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaTools className="text-green-600" />
                    <span className="text-gray-700">
                      <strong>{detalles.ordenes}</strong> {detalles.ordenes === 1 ? 'orden de trabajo' : 'órdenes de trabajo'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alternativa */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>💡 Alternativa:</strong> Si deseas que este cliente no aparezca en las búsquedas, 
              puedes marcarlo como <strong>"Inactivo"</strong> desde la opción de editar.
            </p>
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

export default ModalNoSePuedeEliminar;
