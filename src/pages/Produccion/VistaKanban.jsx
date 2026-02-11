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
  FaSync,
  FaTimes
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
  const [busquedaNumero, setBusquedaNumero] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState('');

  const columnas = [
    { id: 'pendiente', titulo: 'En Proceso', color: 'yellow', icono: FaClock },
    { id: 'en_preprensa', titulo: 'Preprensa', color: 'blue', icono: FaPlay },
    { id: 'en_prensa', titulo: 'Impresión', color: 'purple', icono: FaPlay },
    { id: 'en_acabados', titulo: 'Acabados/Empacado', color: 'orange', icono: FaPlay },
    { id: 'en_control_calidad', titulo: 'Listo p/Entrega', color: 'indigo', icono: FaCheckCircle },
    { id: 'entregado', titulo: 'Entregado', color: 'green', icono: FaCheckCircle }
  ];

  useEffect(() => {
    cargarOrdenes();
  }, [filtroResponsable, busquedaActiva]);

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/ordenes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar órdenes de producción');
      }

      const data = await response.json();
      console.log('📦 Órdenes recibidas del backend:', data);

      // Inicializar las columnas vacías
      const ordenesAgrupadas = {
        pendiente: [],
        en_preprensa: [],
        en_prensa: [],
        en_acabados: [],
        en_control_calidad: [],
        entregado: []
      };

      // Filtrar por número de orden si hay búsqueda activa
      let ordenesFiltradas = data.ordenes || [];
      if (busquedaActiva && busquedaActiva.trim() !== '') {
        const busqueda = busquedaActiva.toLowerCase().trim();
        ordenesFiltradas = ordenesFiltradas.filter(orden => 
          orden.numero_orden?.toLowerCase().includes(busqueda)
        );
      }

      // Agrupar las órdenes por estado
      if (ordenesFiltradas && Array.isArray(ordenesFiltradas)) {
        ordenesFiltradas.forEach(orden => {
          // Normalizar el estado para que coincida con las columnas del Kanban
          let estadoNormalizado = orden.estado?.trim();
          
          // Mapear estados del backend a estados del Kanban
          if (estadoNormalizado === 'en producción' || estadoNormalizado === 'En producción' || 
              estadoNormalizado === 'pendiente' || estadoNormalizado === 'Pendiente' ||
              estadoNormalizado === 'En Proceso') {
            estadoNormalizado = 'pendiente';
          } else if (estadoNormalizado === 'en preprensa' || estadoNormalizado === 'En Preprensa' ||
                     estadoNormalizado === 'En Pre-prensa') {
            estadoNormalizado = 'en_preprensa';
          } else if (estadoNormalizado === 'en prensa' || estadoNormalizado === 'En Prensa' || 
                     estadoNormalizado === 'En Impresión' || estadoNormalizado === 'en impresión') {
            estadoNormalizado = 'en_prensa';
          } else if (estadoNormalizado === 'en acabados' || estadoNormalizado === 'En Acabados' ||
                     estadoNormalizado === 'En Empacado' || estadoNormalizado === 'en empacado') {
            estadoNormalizado = 'en_acabados';
          } else if (estadoNormalizado === 'en control de calidad' || estadoNormalizado === 'En Control de Calidad' ||
                     estadoNormalizado === 'Listo para Entrega' || estadoNormalizado === 'listo para entrega') {
            estadoNormalizado = 'en_control_calidad';
          } else if (estadoNormalizado === 'entregado' || estadoNormalizado === 'Entregado' || 
                     estadoNormalizado === 'completado' || estadoNormalizado === 'Completado' ||
                     estadoNormalizado === 'Facturado' || estadoNormalizado === 'facturado') {
            estadoNormalizado = 'entregado';
          }

          // Agregar la orden a la columna correspondiente
          if (ordenesAgrupadas[estadoNormalizado]) {
            ordenesAgrupadas[estadoNormalizado].push({
              ...orden,
              responsable_actual: orden.vendedor || orden.preprensa || orden.prensa || orden.terminados || 'Sin asignar'
            });
          } else {
            // Si el estado no coincide con ninguna columna, ponerlo en pendiente
            ordenesAgrupadas.pendiente.push({
              ...orden,
              responsable_actual: orden.vendedor || 'Sin asignar'
            });
          }
        });
      }

      console.log('✅ Órdenes agrupadas:', ordenesAgrupadas);
      setOrdenes(ordenesAgrupadas);
    } catch (error) {
      console.error('❌ Error al cargar órdenes:', error);
      // Mantener las columnas vacías en caso de error
      setOrdenes({
        pendiente: [],
        en_preprensa: [],
        en_prensa: [],
        en_acabados: [],
        en_control_calidad: [],
        entregado: []
      });
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

    // NOTA: Esta funcionalidad está deshabilitada temporalmente
    // Más adelante, cada área reportará el cambio de estado desde su propia interfaz
    alert('⚠️ La actualización de estados se realizará desde las interfaces específicas de cada área (Preprensa, Prensa, Acabados, etc.)');
    setDraggedItem(null);
    
    /* CÓDIGO COMENTADO PARA FUTURA IMPLEMENTACIÓN
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${draggedItem.id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

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
      
      // Recargar las órdenes
      cargarOrdenes();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setDraggedItem(null);
    }
    */
  };

  const ejecutarBusqueda = () => {
    setBusquedaActiva(busquedaNumero);
  };

  const limpiarBusqueda = () => {
    setBusquedaNumero('');
    setBusquedaActiva('');
  };

  const handleKeyPressBusqueda = (e) => {
    if (e.key === 'Enter') {
      ejecutarBusqueda();
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vista Kanban - Producción</h1>
            <p className="text-gray-600">Seguimiento visual del flujo de producción</p>
          </div>
          
          {/* Filtros */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por número de orden..."
                value={busquedaNumero}
                onChange={(e) => setBusquedaNumero(e.target.value)}
                onKeyPress={handleKeyPressBusqueda}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <button
                onClick={ejecutarBusqueda}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Buscar orden"
              >
                <FaFilter className="h-4 w-4" />
                Buscar
              </button>
              {busquedaActiva && (
                <button
                  onClick={limpiarBusqueda}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <FaTimes className="h-4 w-4" />
                  Limpiar
                </button>
              )}
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

      {/* Mensaje informativo */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Vista de solo visualización:</strong> Este tablero muestra todas las órdenes en producción. 
              Los cambios de estado se realizarán desde las interfaces específicas de cada área (Preprensa, Prensa, Acabados, etc.).
            </p>
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
