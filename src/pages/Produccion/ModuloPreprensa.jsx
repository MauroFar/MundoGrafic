import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaPlay, 
  FaPause, 
  FaCheckCircle, 
  FaClock, 
  FaUser, 
  FaCalendarAlt,
  FaFileAlt,
  FaPalette,
  FaEye,
  FaEdit,
  FaUpload,
  FaDownload,
  FaExclamationTriangle
} from 'react-icons/fa';

const ModuloPreprensa = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [showModalArchivos, setShowModalArchivos] = useState(false);

  useEffect(() => {
    cargarOrdenesPreprensa();
  }, [filtroEstado]);

  const cargarOrdenesPreprensa = async () => {
    setLoading(true);
    try {
      // Simular carga de datos con datos ficticios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos ficticios para preprensa
      const data = [
        {
          id: 1,
          numero_orden: 'OT-2024-001',
          nombre_cliente: 'Empresa ABC S.A.',
          concepto: 'Tarjetas de presentación corporativas',
          estado_preprensa: 'pendiente',
          responsable_preprensa: 'Juan Pérez',
          fecha_entrega: '2024-01-15',
          archivos_count: 3,
          cantidad: '1000',
          observaciones_preprensa: 'Archivos recibidos, pendiente revisión de colores'
        },
        {
          id: 2,
          numero_orden: 'OT-2024-002',
          nombre_cliente: 'Tienda XYZ',
          concepto: 'Volantes promocionales',
          estado_preprensa: 'en_proceso',
          responsable_preprensa: 'María García',
          fecha_entrega: '2024-01-12',
          archivos_count: 5,
          cantidad: '5000',
          observaciones_preprensa: 'En proceso de ajuste de colores'
        },
        {
          id: 3,
          numero_orden: 'OT-2024-003',
          nombre_cliente: 'Restaurante El Buen Sabor',
          concepto: 'Menús del restaurante',
          estado_preprensa: 'completada',
          responsable_preprensa: 'Carlos López',
          fecha_entrega: '2024-01-10',
          archivos_count: 2,
          cantidad: '200',
          observaciones_preprensa: 'Archivos listos para impresión'
        },
        {
          id: 4,
          numero_orden: 'OT-2024-004',
          nombre_cliente: 'Clínica San José',
          concepto: 'Folleto médico',
          estado_preprensa: 'con_problemas',
          responsable_preprensa: 'Ana Martínez',
          fecha_entrega: '2024-01-08',
          archivos_count: 1,
          cantidad: '1000',
          observaciones_preprensa: 'Problemas con resolución de imágenes'
        }
      ];
      setOrdenes(data);
    } catch (error) {
      console.error('Error al cargar órdenes de preprensa:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoPreprensa = async (ordenId, nuevoEstado) => {
    try {
      // Simular cambio de estado con datos ficticios
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar el estado local
      setOrdenes(prev => 
        prev.map(orden => 
          orden.id === ordenId 
            ? { ...orden, estado_preprensa: nuevoEstado }
            : orden
        )
      );

      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Estado actualizado",
          mensaje: `Orden #${ordenId} actualizada en preprensa`,
          tipo: "success",
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_proceso': 'bg-blue-100 text-blue-800',
      'completada': 'bg-green-100 text-green-800',
      'con_problemas': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getIconoEstado = (estado) => {
    const iconos = {
      'pendiente': <FaClock className="text-yellow-600" />,
      'en_proceso': <FaPlay className="text-blue-600" />,
      'completada': <FaCheckCircle className="text-green-600" />,
      'con_problemas': <FaExclamationTriangle className="text-red-600" />
    };
    return iconos[estado] || <FaClock className="text-gray-600" />;
  };

  const abrirDetalleOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setShowModalDetalle(true);
  };

  const abrirArchivosOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setShowModalArchivos(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Módulo de Preprensa</h1>
            <p className="text-gray-600">Gestión y seguimiento de trabajos en preprensa</p>
          </div>
          
          {/* Filtros */}
          <div className="flex gap-4 items-center">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completadas</option>
              <option value="con_problemas">Con Problemas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ordenes.filter(o => o.estado_preprensa === 'pendiente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaPlay className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ordenes.filter(o => o.estado_preprensa === 'en_proceso').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ordenes.filter(o => o.estado_preprensa === 'completada').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FaExclamationTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Problemas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ordenes.filter(o => o.estado_preprensa === 'con_problemas').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Órdenes */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Órdenes en Preprensa</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Preprensa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{orden.numero_orden}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.nombre_cliente}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {orden.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getIconoEstado(orden.estado_preprensa)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado_preprensa)}`}>
                        {orden.estado_preprensa?.replace('_', ' ').toUpperCase() || 'PENDIENTE'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.responsable_preprensa || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString() : 'Sin fecha'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {orden.archivos_count || 0} archivos
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirDetalleOrden(orden)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => abrirArchivosOrden(orden)}
                        className="text-green-600 hover:text-green-900"
                        title="Gestionar archivos"
                      >
                        <FaFileAlt className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/ordendeTrabajo/editar/${orden.id}`)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Editar orden"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Orden */}
      {showModalDetalle && ordenSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Detalle de Orden #{ordenSeleccionada.numero_orden}
              </h2>
              <button
                onClick={() => setShowModalDetalle(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información General */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Información General</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{ordenSeleccionada.nombre_cliente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Concepto:</span>
                    <span className="font-medium">{ordenSeleccionada.concepto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-medium">{ordenSeleccionada.cantidad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha Entrega:</span>
                    <span className="font-medium">
                      {ordenSeleccionada.fecha_entrega ? new Date(ordenSeleccionada.fecha_entrega).toLocaleDateString() : 'Sin fecha'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estado y Responsable */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Estado Actual</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    {getIconoEstado(ordenSeleccionada.estado_preprensa)}
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(ordenSeleccionada.estado_preprensa)}`}>
                      {ordenSeleccionada.estado_preprensa?.replace('_', ' ').toUpperCase() || 'PENDIENTE'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsable de Preprensa
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={ordenSeleccionada.responsable_preprensa || ''}
                      onChange={(e) => {
                        // Aquí podrías implementar la actualización del responsable
                      }}
                      placeholder="Asignar responsable"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones de Preprensa
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Agregar observaciones..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowModalDetalle(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => cambiarEstadoPreprensa(ordenSeleccionada.id, 'en_proceso')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Iniciar Trabajo
              </button>
              <button
                onClick={() => cambiarEstadoPreprensa(ordenSeleccionada.id, 'completada')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Completar Preprensa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Archivos */}
      {showModalArchivos && ordenSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Archivos - Orden #{ordenSeleccionada.numero_orden}
              </h2>
              <button
                onClick={() => setShowModalArchivos(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Subir archivos */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FaUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Seleccionar Archivos
                </label>
              </div>

              {/* Lista de archivos */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Archivos Subidos</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-center">No hay archivos subidos aún</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModalArchivos(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuloPreprensa;
