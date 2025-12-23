import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaClock, 
  FaPlay, 
  FaEye, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaArrowRight,
  FaFilter,
  FaSync
} from 'react-icons/fa';

const VistaKanban = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  
  const [ordenes, setOrdenes] = useState({
    pendiente: [],
    en_preprensa: [],
    en_prensa: [],
    en_acabados: [],
    en_control_calidad: [],
    entregado: []
  });
  
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [filtroResponsable, setFiltroResponsable] = useState('todos');

  const columnas = [
    { id: 'pendiente', titulo: 'Pendientes', color: 'yellow', icono: FaClock },
    { id: 'en_preprensa', titulo: 'Preprensa', color: 'blue', icono: FaPlay },
    { id: 'en_prensa', titulo: 'Prensa', color: 'purple', icono: FaPlay },
    { id: 'en_acabados', titulo: 'Acabados', color: 'orange', icono: FaPlay },
    { id: 'en_control_calidad', titulo: 'Control', color: 'indigo', icono: FaEye },
    { id: 'entregado', titulo: 'Entregado', color: 'green', icono: FaCheckCircle }
  ];

  useEffect(() => {
    cargarOrdenes();
  }, [filtroResponsable]);

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      // Simular carga de datos con datos ficticios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos ficticios para el Kanban
      const data = {
        pendiente: [
          {
            id: 1,
            numero_orden: 'OT-2024-001',
            nombre_cliente: 'Empresa ABC S.A.',
            concepto: 'Tarjetas de presentación corporativas',
            estado: 'pendiente',
            fecha_entrega: '2024-01-15',
            responsable_actual: 'Juan Pérez'
          },
          {
            id: 6,
            numero_orden: 'OT-2024-006',
            nombre_cliente: 'Hotel Plaza',
            concepto: 'Folletos turísticos',
            estado: 'pendiente',
            fecha_entrega: '2024-01-20',
            responsable_actual: 'Sin asignar'
          }
        ],
        en_preprensa: [
          {
            id: 2,
            numero_orden: 'OT-2024-002',
            nombre_cliente: 'Tienda XYZ',
            concepto: 'Volantes promocionales',
            estado: 'en_preprensa',
            fecha_entrega: '2024-01-12',
            responsable_actual: 'María García'
          },
          {
            id: 7,
            numero_orden: 'OT-2024-007',
            nombre_cliente: 'Farmacia Central',
            concepto: 'Catálogo de productos',
            estado: 'en_preprensa',
            fecha_entrega: '2024-01-18',
            responsable_actual: 'Luis Rodríguez'
          }
        ],
        en_prensa: [
          {
            id: 3,
            numero_orden: 'OT-2024-003',
            nombre_cliente: 'Restaurante El Buen Sabor',
            concepto: 'Menús del restaurante',
            estado: 'en_prensa',
            fecha_entrega: '2024-01-10',
            responsable_actual: 'Carlos López'
          }
        ],
        en_acabados: [
          {
            id: 4,
            numero_orden: 'OT-2024-004',
            nombre_cliente: 'Clínica San José',
            concepto: 'Folleto médico',
            estado: 'en_acabados',
            fecha_entrega: '2024-01-08',
            responsable_actual: 'Ana Martínez'
          }
        ],
        en_control_calidad: [
          {
            id: 8,
            numero_orden: 'OT-2024-008',
            nombre_cliente: 'Escuela Primaria',
            concepto: 'Material educativo',
            estado: 'en_control_calidad',
            fecha_entrega: '2024-01-06',
            responsable_actual: 'Pedro González'
          }
        ],
        entregado: [
          {
            id: 5,
            numero_orden: 'OT-2024-005',
            nombre_cliente: 'Gym Fitness Plus',
            concepto: 'Posters promocionales',
            estado: 'entregado',
            fecha_entrega: '2024-01-05',
            responsable_actual: 'Roberto Silva'
          }
        ]
      };
      setOrdenes(data);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, orden) => {
    setDraggedItem(orden);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.estado === nuevoEstado) {
      setDraggedItem(null);
      return;
    }

    try {
      // Simular cambio de estado con datos ficticios
      await new Promise(resolve => setTimeout(resolve, 500));

      // Actualizar el estado local
      const ordenActualizada = { ...draggedItem, estado: nuevoEstado };
      
      setOrdenes(prev => ({
        ...prev,
        [draggedItem.estado]: prev[draggedItem.estado].filter(o => o.id !== draggedItem.id),
        [nuevoEstado]: [...prev[nuevoEstado], ordenActualizada]
      }));

      // Notificación
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Estado actualizado",
          mensaje: `Orden #${draggedItem.numero_orden} movida a ${nuevoEstado.replace('_', ' ')}`,
          tipo: "success",
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setDraggedItem(null);
    }
  };

  const getUrgenciaColor = (fechaEntrega) => {
    if (!fechaEntrega) return 'border-gray-200';
    
    const hoy = new Date();
    const entrega = new Date(fechaEntrega);
    const diasRestantes = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) return 'border-red-400 bg-red-50';
    if (diasRestantes <= 1) return 'border-orange-400 bg-orange-50';
    if (diasRestantes <= 3) return 'border-yellow-400 bg-yellow-50';
    return 'border-gray-200';
  };

  const getUrgenciaTexto = (fechaEntrega) => {
    if (!fechaEntrega) return '';
    
    const hoy = new Date();
    const entrega = new Date(fechaEntrega);
    const diasRestantes = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) return 'VENCIDA';
    if (diasRestantes === 0) return 'HOY';
    if (diasRestantes === 1) return 'MAÑANA';
    return `${diasRestantes} días`;
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
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vista Kanban</h1>
            <p className="text-gray-600">Seguimiento visual del flujo de producción</p>
          </div>
          
          {/* Filtros */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filtroResponsable}
                onChange={(e) => setFiltroResponsable(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los responsables</option>
                <option value="preprensa">Preprensa</option>
                <option value="prensa">Prensa</option>
                <option value="acabados">Acabados</option>
                <option value="calidad">Control de Calidad</option>
              </select>
            </div>
            
            <button
              onClick={cargarOrdenes}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSync className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {columnas.map((columna) => {
          const IconoColumna = columna.icono;
          const ordenesColumna = ordenes[columna.id] || [];
          
          return (
            <div
              key={columna.id}
              className={`flex-shrink-0 w-80 bg-${columna.color}-50 rounded-lg p-4`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna.id)}
            >
              {/* Header de la columna */}
              <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-${columna.color}-200`}>
                <IconoColumna className={`h-5 w-5 text-${columna.color}-600`} />
                <h3 className={`font-semibold text-${columna.color}-800`}>
                  {columna.titulo}
                </h3>
                <span className={`ml-auto px-2 py-1 text-xs font-medium bg-${columna.color}-200 text-${columna.color}-800 rounded-full`}>
                  {ordenesColumna.length}
                </span>
              </div>

              {/* Tarjetas de órdenes */}
              <div className="space-y-3">
                {ordenesColumna.map((orden) => (
                  <div
                    key={orden.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, orden)}
                    className={`bg-white rounded-lg shadow-sm border-2 ${getUrgenciaColor(orden.fecha_entrega)} p-4 cursor-move hover:shadow-md transition-shadow`}
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">#{orden.numero_orden}</span>
                        {orden.fecha_entrega && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            getUrgenciaTexto(orden.fecha_entrega) === 'VENCIDA' ? 'bg-red-100 text-red-800' :
                            getUrgenciaTexto(orden.fecha_entrega) === 'HOY' ? 'bg-orange-100 text-orange-800' :
                            getUrgenciaTexto(orden.fecha_entrega) === 'MAÑANA' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getUrgenciaTexto(orden.fecha_entrega)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/produccion/seguimiento/${orden.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Cliente */}
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {orden.nombre_cliente}
                      </p>
                    </div>

                    {/* Concepto */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {orden.concepto}
                      </p>
                    </div>

                    {/* Información adicional */}
                    <div className="space-y-1 text-xs text-gray-500">
                      {orden.responsable_actual && (
                        <div className="flex items-center gap-1">
                          <FaUser className="h-3 w-3" />
                          <span>{orden.responsable_actual}</span>
                        </div>
                      )}
                      {orden.fecha_entrega && (
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="h-3 w-3" />
                          <span>{new Date(orden.fecha_entrega).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/ordendeTrabajo/editar/${orden.id}`)}
                          className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => navigate(`/produccion/seguimiento/${orden.id}`)}
                          className="flex-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          Seguir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Mensaje cuando no hay órdenes */}
                {ordenesColumna.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No hay órdenes en esta etapa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leyenda de Colores</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
            <span className="text-sm text-gray-700">Vencida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-400 rounded"></div>
            <span className="text-sm text-gray-700">Entrega hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
            <span className="text-sm text-gray-700">Próxima entrega</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
            <span className="text-sm text-gray-700">Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaKanban;
