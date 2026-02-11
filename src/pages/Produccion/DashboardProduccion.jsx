import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaChartLine, 
  FaClock, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaPlay, 
  FaPause, 
  FaStop,
  FaEye,
  FaFilter,
  FaSync,
  FaEdit,
  FaPrint,
  FaCut
} from 'react-icons/fa';
import AlertasTiempo from '../../components/AlertasTiempo';
import EstadisticasTiempoReal from '../../components/EstadisticasTiempoReal';
import ResumenPorArea from '../../components/ResumenPorArea';
import AccionesRapidas from '../../components/AccionesRapidas';
import FiltrosAvanzados from '../../components/FiltrosAvanzados';
import GraficosEstadisticas from '../../components/GraficosEstadisticas';
import ProductividadDiaria from '../../components/ProductividadDiaria';
import MetricasClave from '../../components/MetricasClave';
import EstadoSistema from '../../components/EstadoSistema';
import ActividadesRecientes from '../../components/ActividadesRecientes';
import ProductividadEmpleados from '../../components/ProductividadEmpleados';
import MetricasCalidad from '../../components/MetricasCalidad';
import MetricasTiempo from '../../components/MetricasTiempo';
import MetricasCostos from '../../components/MetricasCostos';
import MetricasSatisfaccion from '../../components/MetricasSatisfaccion';
import MetricasInnovacion from '../../components/MetricasInnovacion';
import MetricasSostenibilidad from '../../components/MetricasSostenibilidad';
import MetricasSeguridad from '../../components/MetricasSeguridad';

const DashboardProduccion = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  
  const [metricas, setMetricas] = useState({
    totalOrdenes: 0,
    pendientes: 0,
    enProceso: 0,
    retrasadas: 0,
    completadasHoy: 0
  });
  
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('hoy');

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, filtroFecha]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Cargar métricas reales desde el backend
      const responseMetricas = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/metricas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!responseMetricas.ok) {
        throw new Error('Error al cargar métricas de producción');
      }

      const dataMetricas = await responseMetricas.json();
      console.log('📊 Métricas recibidas:', dataMetricas);

      // Actualizar las métricas con datos reales
      if (dataMetricas.success && dataMetricas.metricas) {
        setMetricas({
          totalOrdenes: dataMetricas.metricas.totalOrdenes || 0,
          pendientes: dataMetricas.metricas.pendientes || 0,
          enProceso: dataMetricas.metricas.enProceso || 0,
          retrasadas: dataMetricas.metricas.retrasadas || 0,
          completadasHoy: dataMetricas.metricas.completadasHoy || 0
        });
      }

      // Cargar órdenes recientes
      const responseOrdenes = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/ordenes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (responseOrdenes.ok) {
        const dataOrdenes = await responseOrdenes.json();
        if (dataOrdenes.success && dataOrdenes.ordenes) {
          // Tomar solo las 5 más recientes
          setOrdenesRecientes(dataOrdenes.ordenes.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      // Mantener métricas en 0 en caso de error
      setMetricas({
        totalOrdenes: 0,
        pendientes: 0,
        enProceso: 0,
        retrasadas: 0,
        completadasHoy: 0
      });
    } finally {
      setLoading(false);
    }
  };

  /* NOTA: Esta función está deshabilitada. Los cambios de estado se realizarán desde las interfaces específicas de cada área
  const cambiarEstadoOrden = async (ordenId, nuevoEstado) => {
    try {
      // Simular cambio de estado con datos ficticios
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar el estado local
      setOrdenesRecientes(prev => 
        prev.map(orden => 
          orden.id === ordenId 
            ? { ...orden, estado: nuevoEstado }
            : orden
        )
      );

      // Mostrar notificación de éxito
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Estado actualizado",
          mensaje: `Orden #${ordenId} actualizada a estado: ${nuevoEstado.replace('_', ' ')}`,
          tipo: "success",
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };
  */

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_preprensa': 'bg-blue-100 text-blue-800',
      'en_prensa': 'bg-purple-100 text-purple-800',
      'en_acabados': 'bg-orange-100 text-orange-800',
      'en_control_calidad': 'bg-indigo-100 text-indigo-800',
      'entregado': 'bg-green-100 text-green-800',
      'retrasada': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getIconoEstado = (estado) => {
    const iconos = {
      'pendiente': <FaClock className="text-yellow-600" />,
      'en_preprensa': <FaPlay className="text-blue-600" />,
      'en_prensa': <FaPlay className="text-purple-600" />,
      'en_acabados': <FaPlay className="text-orange-600" />,
      'en_control_calidad': <FaEye className="text-indigo-600" />,
      'entregado': <FaCheckCircle className="text-green-600" />,
      'retrasada': <FaExclamationTriangle className="text-red-600" />
    };
    return iconos[estado] || <FaClock className="text-gray-600" />;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Producción</h1>
        <p className="text-gray-600">Seguimiento y control del flujo de trabajo</p>
      </div>

      {/* Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaChartLine className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-semibold text-gray-900">{metricas.totalOrdenes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{metricas.pendientes}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{metricas.enProceso}</p>
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

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_preprensa">En Preprensa</option>
            <option value="en_prensa">En Prensa</option>
            <option value="en_acabados">En Acabados</option>
            <option value="en_control_calidad">En Control</option>
            <option value="entregado">Entregadas</option>
            <option value="retrasada">Retrasadas</option>
          </select>

          <select
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="todos">Todos</option>
          </select>

          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaSync className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="mb-8">
        <FiltrosAvanzados onFiltrosChange={(filtros) => {
          setFiltroEstado(filtros.estado);
          setFiltroFecha(filtros.fecha);
        }} />
      </div>

      {/* Actividades Recientes */}
      <div className="mb-8">
        <ActividadesRecientes />
      </div>

      {/* Estado del Sistema */}
      <div className="mb-8">
        <EstadoSistema />
      </div>

      {/* Métricas Clave */}
      <div className="mb-8">
        <MetricasClave />
      </div>

      {/* Productividad Diaria */}
      <div className="mb-8">
        <ProductividadDiaria />
      </div>

      {/* Productividad por Empleado */}
      <div className="mb-8">
        <ProductividadEmpleados />
      </div>

      {/* Gráficos Estadísticos */}
      <div className="mb-8">
        <GraficosEstadisticas />
      </div>

      {/* Métricas de Calidad */}
      <div className="mb-8">
        <MetricasCalidad />
      </div>

      {/* Métricas de Tiempo */}
      <div className="mb-8">
        <MetricasTiempo />
      </div>

      {/* Métricas de Costos */}
      <div className="mb-8">
        <MetricasCostos />
      </div>

      {/* Métricas de Satisfacción */}
      <div className="mb-8">
        <MetricasSatisfaccion />
      </div>

      {/* Métricas de Innovación */}
      <div className="mb-8">
        <MetricasInnovacion />
      </div>

      {/* Métricas de Sostenibilidad */}
      <div className="mb-8">
        <MetricasSostenibilidad />
      </div>

      {/* Métricas de Seguridad */}
      <div className="mb-8">
        <MetricasSeguridad />
      </div>

      {/* Resumen por Área */}
      <div className="mb-8">
        <ResumenPorArea />
      </div>

      {/* Estadísticas en Tiempo Real */}
      <div className="mb-8">
        <EstadisticasTiempoReal />
      </div>

      {/* Alertas de Tiempo */}
      <div className="mb-8">
        <AlertasTiempo />
      </div>

      {/* Órdenes Recientes */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Órdenes de Trabajo</h2>
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
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesRecientes.map((orden) => (
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
                      {getIconoEstado(orden.estado)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
                        {orden.estado.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString() : 'Sin fecha'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.responsable_actual || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/produccion/seguimiento/${orden.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver seguimiento"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/ordendeTrabajo/editar/${orden.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="Ver/Editar orden"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/produccion/kanban`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver en Kanban"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      {/* NOTA: Los cambios de estado se realizarán desde las interfaces específicas de cada área */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="mt-8">
        <AccionesRapidas />
      </div>
    </div>
  );
};

export default DashboardProduccion;
