import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaChartLine, 
  FaClock, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaPlay, 
  FaSync,
  FaEdit,
  FaPrint,
  FaCut,
  FaEye
} from 'react-icons/fa';

const DashboardProduccion = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  
  const [metricas, setMetricas] = useState({
    totalEnProduccion: 0,
    retrasadas: 0,
    porEntregarHoy: 0,
    porEntregarSemana: 0,
    completadasHoy: 0,
    distribucionEtapas: [],
    promedioDiasProduccion: '0.0'
  });
  
  const [ordenesEnProduccion, setOrdenesEnProduccion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Cargar órdenes en producción
      const ordenesResponse = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/ordenes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!ordenesResponse.ok) {
        throw new Error('Error al cargar órdenes en producción');
      }

      const ordenesData = await ordenesResponse.json();
      
      // Cargar métricas
      const metricasResponse = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/metricas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!metricasResponse.ok) {
        throw new Error('Error al cargar métricas');
      }

      const metricasData = await metricasResponse.json();

      setOrdenesEnProduccion(ordenesData.ordenes || []);
      setMetricas(metricasData.metricas || {
        totalEnProduccion: 0,
        retrasadas: 0,
        porEntregarHoy: 0,
        porEntregarSemana: 0,
        completadasHoy: 0,
        distribucionEtapas: [],
        promedioDiasProduccion: '0.0'
      });

      console.log('✅ Datos de producción cargados:', {
        ordenes: ordenesData.ordenes?.length || 0,
        metricas: metricasData.metricas
      });
    } catch (error) {
      console.error('❌ Error al cargar datos de producción:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoOrden = async (ordenId, nuevoEstado, preprensa, prensa, terminados) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${ordenId}/estado`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          estado: nuevoEstado,
          preprensa,
          prensa,
          terminados
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      // Recargar datos
      await cargarDatos();

      // Mostrar notificación de éxito
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Estado actualizado",
          mensaje: `Orden actualizada correctamente`,
          tipo: "success",
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Error",
          mensaje: error.message || "No se pudo actualizar el estado",
          tipo: "error",
          fecha: new Date().toLocaleString()
        }
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Cargando datos de producción...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Error al cargar datos</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={cargarDatos}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trabajos en Producción</h1>
          <p className="text-gray-600">Seguimiento y control del flujo de trabajo en tiempo real</p>
        </div>
        <button 
          onClick={cargarDatos}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaChartLine className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Producción</p>
              <p className="text-2xl font-semibold text-gray-900">{metricas.totalEnProduccion}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entregar Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">{metricas.porEntregarHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <FaClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-2xl font-semibold text-gray-900">{metricas.porEntregarSemana}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FaExclamationTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Retrasadas</p>
              <p className="text-2xl font-semibold text-gray-900">{metricas.retrasadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">{metricas.completadasHoy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Órdenes en Producción */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Órdenes en Producción</h2>
            <p className="text-sm text-gray-600 mt-1">
              {ordenesEnProduccion.length} {ordenesEnProduccion.length === 1 ? 'orden activa' : 'órdenes activas'}
            </p>
          </div>
        </div>
        
        {ordenesEnProduccion.length === 0 ? (
          <div className="p-12 text-center">
            <FaCheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay órdenes en producción
            </h3>
            <p className="text-gray-600">
              Las órdenes aparecerán aquí cuando sean enviadas a producción desde la sección de Orden de Trabajo
            </p>
          </div>
        ) : (
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
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Etapa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Entrega
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordenesEnProduccion.map((orden) => {
                  const fechaEntrega = new Date(orden.fecha_entrega);
                  const hoy = new Date();
                  const esRetrasada = fechaEntrega < hoy;
                  const esHoy = fechaEntrega.toDateString() === hoy.toDateString();
                  
                  // Determinar etapa actual
                  let etapa = 'Pendiente';
                  let etapaColor = 'bg-yellow-100 text-yellow-800';
                  
                  if (orden.terminados) {
                    etapa = 'Acabados';
                    etapaColor = 'bg-green-100 text-green-800';
                  } else if (orden.prensa) {
                    etapa = 'Prensa';
                    etapaColor = 'bg-purple-100 text-purple-800';
                  } else if (orden.preprensa) {
                    etapa = 'Preprensa';
                    etapaColor = 'bg-blue-100 text-blue-800';
                  }
                  
                  return (
                    <tr 
                      key={orden.id} 
                      className={`hover:bg-gray-50 ${esRetrasada ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {orden.numero_orden}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {orden.nombre_cliente}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {orden.concepto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {orden.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${etapaColor}`}>
                          {etapa}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {esRetrasada && <FaExclamationTriangle className="text-red-600" />}
                          {esHoy && <FaClock className="text-yellow-600" />}
                          <span className={esRetrasada ? 'text-red-600 font-semibold' : esHoy ? 'text-yellow-600 font-semibold' : 'text-gray-900'}>
                            {fechaEntrega.toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {orden.vendedor || 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/ordendeTrabajo/ver/${orden.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalle"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/ordendeTrabajo/editar/${orden.id}`)}
                            className="text-green-600 hover:text-green-900"
                            title="Editar orden"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          {!orden.preprensa && (
                            <button
                              onClick={() => cambiarEstadoOrden(orden.id, 'en producción', true, false, false)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Iniciar preprensa"
                            >
                              <FaPlay className="h-4 w-4" />
                            </button>
                          )}
                          {orden.preprensa && !orden.prensa && (
                            <button
                              onClick={() => cambiarEstadoOrden(orden.id, 'en producción', true, true, false)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Mover a prensa"
                            >
                              <FaPrint className="h-4 w-4" />
                            </button>
                          )}
                          {orden.prensa && !orden.terminados && (
                            <button
                              onClick={() => cambiarEstadoOrden(orden.id, 'en producción', true, true, true)}
                              className="text-teal-600 hover:text-teal-900"
                              title="Mover a acabados"
                            >
                              <FaCut className="h-4 w-4" />
                            </button>
                          )}
                          {orden.terminados && (
                            <button
                              onClick={() => cambiarEstadoOrden(orden.id, 'completado', true, true, true)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como completado"
                            >
                              <FaCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProduccion;
