import React, { useState } from 'react';
import { FaFilter, FaSearch, FaCalendarAlt, FaUser, FaTimes } from 'react-icons/fa';

const FiltrosAvanzados = ({ onFiltrosChange }) => {
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fecha: 'hoy',
    responsable: 'todos',
    cliente: '',
    orden: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const estados = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'en_preprensa', label: 'En Preprensa' },
    { value: 'en_prensa', label: 'En Prensa' },
    { value: 'en_acabados', label: 'En Acabados' },
    { value: 'en_control_calidad', label: 'En Control de Calidad' },
    { value: 'entregado', label: 'Entregadas' },
    { value: 'retrasada', label: 'Retrasadas' }
  ];

  const fechas = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Esta semana' },
    { value: 'mes', label: 'Este mes' },
    { value: 'todos', label: 'Todos' }
  ];

  const responsables = [
    { value: 'todos', label: 'Todos los responsables' },
    { value: 'Juan Pérez', label: 'Juan Pérez' },
    { value: 'María García', label: 'María García' },
    { value: 'Carlos López', label: 'Carlos López' },
    { value: 'Ana Martínez', label: 'Ana Martínez' },
    { value: 'Roberto Silva', label: 'Roberto Silva' }
  ];

  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      estado: 'todos',
      fecha: 'hoy',
      responsable: 'todos',
      cliente: '',
      orden: ''
    };
    setFiltros(filtrosLimpios);
    onFiltrosChange(filtrosLimpios);
  };

  const tieneFiltrosActivos = () => {
    return filtros.estado !== 'todos' || 
           filtros.fecha !== 'hoy' || 
           filtros.responsable !== 'todos' || 
           filtros.cliente !== '' || 
           filtros.orden !== '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaFilter className="text-gray-600" />
          Filtros
        </h3>
        <div className="flex gap-2">
          {tieneFiltrosActivos() && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <FaTimes className="h-4 w-4" />
              Limpiar
            </button>
          )}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaFilter className="h-4 w-4" />
            {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
          </button>
        </div>
      </div>

      {/* Filtros básicos siempre visibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={filtros.estado}
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {estados.map(estado => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
          <select
            value={filtros.fecha}
            onChange={(e) => handleFiltroChange('fecha', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {fechas.map(fecha => (
              <option key={fecha.value} value={fecha.value}>
                {fecha.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
          <select
            value={filtros.responsable}
            onChange={(e) => handleFiltroChange('responsable', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {responsables.map(responsable => (
              <option key={responsable.value} value={responsable.value}>
                {responsable.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros avanzados */}
      {mostrarFiltros && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-md font-medium text-gray-700 mb-4">Filtros Avanzados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={filtros.cliente}
                  onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                  placeholder="Buscar por cliente..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número de Orden</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={filtros.orden}
                  onChange={(e) => handleFiltroChange('orden', e.target.value)}
                  placeholder="Buscar por número de orden..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de filtros activos */}
      {tieneFiltrosActivos() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            {filtros.estado !== 'todos' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Estado: {estados.find(e => e.value === filtros.estado)?.label}
              </span>
            )}
            {filtros.fecha !== 'hoy' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Período: {fechas.find(f => f.value === filtros.fecha)?.label}
              </span>
            )}
            {filtros.responsable !== 'todos' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Responsable: {filtros.responsable}
              </span>
            )}
            {filtros.cliente && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Cliente: {filtros.cliente}
              </span>
            )}
            {filtros.orden && (
              <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                Orden: {filtros.orden}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltrosAvanzados;
