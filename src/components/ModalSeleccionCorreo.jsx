import { useState } from 'react';

/**
 * Componente modal reutilizable para seleccionar destinatarios de correo
 * Puede usarse tanto para clientes como para empleados de MundoGrafic
 */
function ModalSeleccionCorreo({ 
  isOpen, 
  onClose, 
  titulo, 
  items, 
  loading, 
  onSeleccionar,
  tipo, // 'clientes' o 'empleados'
  columnas, // Array de objetos con key, label
  buscarEn, // Array de campos donde buscar
  infoMessage // Mensaje informativo opcional
}) {
  const [busqueda, setBusqueda] = useState('');

  if (!isOpen) return null;

  // Filtrar items según búsqueda
  const itemsFiltrados = items.filter(item => {
    if (!busqueda.trim()) return true;
    
    const busquedaLower = busqueda.toLowerCase();
    return buscarEn.some(campo => {
      const valor = item[campo];
      return valor && valor.toString().toLowerCase().includes(busquedaLower);
    });
  });

  const handleClickFila = (item) => {
    onSeleccionar(item);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Mensaje informativo opcional */}
        {infoMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <i className="fas fa-info-circle mr-2"></i>
              {infoMessage}
            </p>
          </div>
        )}
        
        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Lista de items */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Cargando...
              </div>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">
                {busqueda.trim() ? 'No se encontraron resultados' : `No hay ${tipo} disponibles`}
              </div>
            </div>
          ) : (
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columnas.map((col, idx) => (
                    <th 
                      key={idx} 
                      className={`px-4 py-2 border-b ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleClickFila(item)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    {columnas.map((col, idx) => (
                      <td 
                        key={idx} 
                        className={`px-4 py-2 border-b ${col.align === 'center' ? 'text-center' : ''}`}
                      >
                        {col.render ? col.render(item) : item[col.key] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            {itemsFiltrados.length} {itemsFiltrados.length === 1 ? 'resultado' : 'resultados'}
            {busqueda.trim() && ` (de ${items.length} total${items.length === 1 ? '' : 'es'})`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalSeleccionCorreo;
