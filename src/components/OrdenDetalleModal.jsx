import React from 'react';
import {
  FaTimes,
  FaUser,
  FaFileAlt,
  FaCalendar,
  FaClipboardList,
  FaHistory,
  FaEdit,
  FaEye
} from 'react-icons/fa';

const OrdenDetalleModal = ({ ordenDetalle, onClose, onEdit, onViewPDF, canEdit }) => {
  if (!ordenDetalle) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Detalles de la Orden de Trabajo - {ordenDetalle.tipo_orden === 'digital' ? 'Digital' : 'Offset'}
              </h2>
              <div className="text-green-100 text-lg font-semibold">Orden N° {ordenDetalle.numero_orden}</div>
              {ordenDetalle.numero_cotizacion && (
                <div className="text-green-200 text-sm">Cotización: {ordenDetalle.numero_cotizacion}</div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={onClose} className="text-white hover:bg-green-500 rounded-full p-2 transition-colors">
                <FaTimes size={24} />
              </button>
            </div>
          </div>
          {ordenDetalle.estado && (
            <div className="mt-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  ordenDetalle.estado.toLowerCase() === "en producción"
                    ? "bg-blue-500 text-white"
                    : ordenDetalle.estado.toLowerCase() === "completado"
                    ? "bg-green-500 text-white"
                    : ordenDetalle.estado.toLowerCase() === "pendiente"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {ordenDetalle.estado.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Client Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaUser className="mr-2 text-green-600" /> Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                <p className="text-gray-900 font-medium">{ordenDetalle.nombre_cliente || 'N/A'}</p>
              </div>
              {ordenDetalle.contacto && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm text-gray-500 block mb-1">Contacto</label>
                  <p className="text-gray-900 font-medium">{ordenDetalle.contacto}</p>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm text-gray-500 block mb-1">Email</label>
                <p className="text-gray-900 font-medium">{ordenDetalle.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Technical / Work info (abridged) */}
          {ordenDetalle.detalle?.productos_digital && ordenDetalle.detalle.productos_digital.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                <FaClipboardList className="mr-2 text-green-600" /> Información del Trabajo
              </h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b">Cant</th>
                        <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b">Producto</th>
                        <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b">Cavidad</th>
                        <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b">Metros</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenDetalle.detalle.productos_digital.map((producto, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-1 border-b text-gray-900">{producto.cantidad || 'N/A'}</td>
                          <td className="px-2 py-1 border-b text-gray-900">{producto.producto || producto.descripcion || 'N/A'}</td>
                          <td className="px-2 py-1 border-b text-gray-900">{producto.cavidad || 'N/A'}</td>
                          <td className="px-2 py-1 border-b text-gray-900">{producto.metros_impresos || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Audit + Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaHistory className="mr-2 text-green-600" /> Auditoría
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="text-sm text-gray-600 block mb-2 font-semibold">Creado por</label>
                <p className="text-gray-900 font-medium mb-1">{ordenDetalle.created_by_nombre || 'Sistema'}</p>
                <p className="text-xs text-gray-500">{ordenDetalle.created_at ? new Date(ordenDetalle.created_at).toLocaleString('es-EC') : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            {canEdit && (
              <button
                onClick={() => { onClose(); onEdit(ordenDetalle.id); }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <FaEdit /> Editar
              </button>
            )}
            <button
              onClick={() => { onClose(); onViewPDF(ordenDetalle.id); }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <FaEye /> Ver PDF
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenDetalleModal;
