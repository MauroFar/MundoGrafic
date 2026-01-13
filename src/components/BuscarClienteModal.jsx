import React, { useState, useEffect } from 'react';

/**
 * Componente reutilizable para buscar y seleccionar clientes
 * @param {boolean} show - Controla si el modal está visible
 * @param {function} onClose - Callback cuando se cierra el modal
 * @param {function} onSelect - Callback cuando se selecciona un cliente (recibe el objeto cliente)
 * @param {string} title - Título del modal (por defecto: "Buscar y Seleccionar Cliente")
 */
const BuscarClienteModal = ({ show, onClose, onSelect, title = "Buscar y Seleccionar Cliente" }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Función para buscar clientes
  const buscarClientes = async (termino) => {
    if (!termino || termino.length < 2) {
      setClientes([]);
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(termino)}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Error al buscar clientes");
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Error al buscar clientes:", error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar cuando cambia el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarClientes(busqueda);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Limpiar al cerrar
  const handleClose = () => {
    setBusqueda('');
    setClientes([]);
    onClose();
  };

  // Seleccionar cliente
  const handleSelect = (cliente) => {
    onSelect(cliente);
    handleClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
        
        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre, RUC, teléfono o email..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoFocus
          />
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Buscando clientes...</div>
            </div>
          )}

          {!loading && clientes.length === 0 && busqueda.length >= 2 && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">No se encontraron clientes</div>
            </div>
          )}

          {!loading && clientes.length === 0 && busqueda.length < 2 && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500 text-sm">Ingresa al menos 2 caracteres para buscar</div>
            </div>
          )}

          {!loading && clientes.length > 0 && (
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Nombre</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Empresa</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Teléfono</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 border-b">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 border-b text-sm">{cliente.nombre_cliente}</td>
                    <td className="px-4 py-3 border-b text-sm text-gray-600">{cliente.empresa_cliente || '-'}</td>
                    <td className="px-4 py-3 border-b text-sm text-gray-600">{cliente.email_cliente || '-'}</td>
                    <td className="px-4 py-3 border-b text-sm text-gray-600">{cliente.telefono_cliente || '-'}</td>
                    <td className="px-4 py-3 border-b text-center">
                      <button
                        onClick={() => handleSelect(cliente)}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Seleccionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuscarClienteModal;
