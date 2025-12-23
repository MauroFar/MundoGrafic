import React, { useState, useEffect } from 'react';
import { FaCut, FaPlay, FaPause, FaCheckCircle, FaExclamationTriangle, FaClock, FaCog, FaEye } from 'react-icons/fa';

const ModuloAcabados = () => {
  const [ordenesAcabados, setOrdenesAcabados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarOrdenesAcabados();
  }, []);

  const cargarOrdenesAcabados = () => {
    setCargando(true);
    
    // Simular carga de datos con datos ficticios
    setTimeout(() => {
      const datosFicticios = [
        {
          id: 1,
          numeroOrden: 'OT-2024-001',
          cliente: 'Empresa ABC',
          producto: 'Tarjetas de Presentación',
          cantidad: 1000,
          estado: 'en_proceso',
          proceso: 'Corte y Doblez',
          operador: 'Ana Martínez',
          inicio: new Date(Date.now() - 1 * 60 * 60 * 1000), // Hace 1 hora
          estimado: new Date(Date.now() + 2 * 60 * 60 * 1000), // En 2 horas
          progreso: 60,
          prioridad: 'alta',
          observaciones: 'Corte especial con esquinas redondeadas',
          materiales: ['Papel 300g', 'Cuchilla especial']
        },
        {
          id: 2,
          numeroOrden: 'OT-2024-002',
          cliente: 'Comercial XYZ',
          producto: 'Volantes Promocionales',
          cantidad: 5000,
          estado: 'pendiente',
          proceso: 'Laminado',
          operador: 'Pedro Rodríguez',
          inicio: null,
          estimado: new Date(Date.now() + 3 * 60 * 60 * 1000),
          progreso: 0,
          prioridad: 'media',
          observaciones: 'Laminado brillante en ambas caras',
          materiales: ['Película laminada', 'Adhesivo especial']
        },
        {
          id: 3,
          numeroOrden: 'OT-2024-003',
          cliente: 'Restaurante El Buen Sabor',
          producto: 'Menús',
          cantidad: 200,
          estado: 'completado',
          proceso: 'Encuadernación',
          operador: 'Laura Sánchez',
          inicio: new Date(Date.now() - 4 * 60 * 60 * 1000),
          estimado: new Date(Date.now() - 1 * 60 * 60 * 1000),
          progreso: 100,
          prioridad: 'baja',
          observaciones: 'Encuadernación en espiral metálica',
          materiales: ['Espiral metálica', 'Cubierta transparente']
        }
      ];
      
      setOrdenesAcabados(datosFicticios);
      setCargando(false);
    }, 1000);
  };

  const cambiarEstadoAcabados = (id, nuevoEstado) => {
    setOrdenesAcabados(prev => 
      prev.map(orden => 
        orden.id === id 
          ? { 
              ...orden, 
              estado: nuevoEstado,
              inicio: nuevoEstado === 'en_proceso' ? new Date() : orden.inicio,
              progreso: nuevoEstado === 'completado' ? 100 : orden.progreso
            }
          : orden
      )
    );

    // Disparar notificación
    const evento = new CustomEvent('nueva-notificacion', {
      detail: {
        tipo: 'success',
        titulo: 'Estado Actualizado',
        mensaje: `Orden ${id} cambiada a ${nuevoEstado}`
      }
    });
    window.dispatchEvent(evento);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      en_proceso: 'bg-blue-50 border-blue-200 text-blue-800',
      completado: 'bg-green-50 border-green-200 text-green-800',
      pausado: 'bg-orange-50 border-orange-200 text-orange-800',
      detenido: 'bg-red-50 border-red-200 text-red-800'
    };
    return colores[estado] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      baja: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-red-100 text-red-800',
      critica: 'bg-red-100 text-red-800'
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-800';
  };

  const getProcesoColor = (proceso) => {
    const colores = {
      'Corte y Doblez': 'bg-blue-100 text-blue-800',
      'Laminado': 'bg-purple-100 text-purple-800',
      'Encuadernación': 'bg-green-100 text-green-800',
      'Troquelado': 'bg-orange-100 text-orange-800',
      'Barnizado': 'bg-yellow-100 text-yellow-800'
    };
    return colores[proceso] || 'bg-gray-100 text-gray-800';
  };

  const formatearTiempo = (fecha) => {
    if (!fecha) return 'No iniciado';
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const horas = Math.floor(diferencia / (60 * 60 * 1000));
    const minutos = Math.floor((diferencia % (60 * 60 * 1000)) / (60 * 1000));
    return `${horas}h ${minutos}m`;
  };

  const calcularTiempoRestante = (inicio, estimado, progreso) => {
    if (!inicio || progreso === 0) return 'No calculado';
    const ahora = new Date();
    const tiempoTranscurrido = ahora - inicio;
    const tiempoTotalEstimado = estimado - inicio;
    const tiempoRestante = tiempoTotalEstimado - tiempoTranscurrido;
    
    if (tiempoRestante <= 0) return 'Tiempo agotado';
    
    const horas = Math.floor(tiempoRestante / (60 * 60 * 1000));
    const minutos = Math.floor((tiempoRestante % (60 * 60 * 1000)) / (60 * 1000));
    return `${horas}h ${minutos}m`;
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaCut className="text-purple-600" />
          Módulo de Acabados
        </h2>
        <button
          onClick={cargarOrdenesAcabados}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {ordenesAcabados.filter(o => o.estado === 'en_proceso').length}
          </div>
          <div className="text-sm text-blue-800">En Proceso</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {ordenesAcabados.filter(o => o.estado === 'pendiente').length}
          </div>
          <div className="text-sm text-yellow-800">Pendientes</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {ordenesAcabados.filter(o => o.estado === 'completado').length}
          </div>
          <div className="text-sm text-green-800">Completadas</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {ordenesAcabados.reduce((sum, o) => sum + o.cantidad, 0)}
          </div>
          <div className="text-sm text-purple-800">Total Procesado</div>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesAcabados.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {orden.numeroOrden}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPrioridadColor(orden.prioridad)}`}>
                        {orden.prioridad}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.producto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.cantidad.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getProcesoColor(orden.proceso)}`}>
                      {orden.proceso}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(orden.estado)}`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.operador}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${orden.progreso}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{orden.progreso}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-xs">
                      <div>Inicio: {formatearTiempo(orden.inicio)}</div>
                      <div>Restante: {calcularTiempoRestante(orden.inicio, orden.estimado, orden.progreso)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {orden.estado === 'pendiente' && (
                        <button
                          onClick={() => cambiarEstadoAcabados(orden.id, 'en_proceso')}
                          className="text-green-600 hover:text-green-900"
                          title="Iniciar"
                        >
                          <FaPlay />
                        </button>
                      )}
                      {orden.estado === 'en_proceso' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoAcabados(orden.id, 'pausado')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Pausar"
                          >
                            <FaPause />
                          </button>
                          <button
                            onClick={() => cambiarEstadoAcabados(orden.id, 'completado')}
                            className="text-green-600 hover:text-green-900"
                            title="Completar"
                          >
                            <FaCheckCircle />
                          </button>
                        </>
                      )}
                      {orden.estado === 'pausado' && (
                        <button
                          onClick={() => cambiarEstadoAcabados(orden.id, 'en_proceso')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Reanudar"
                        >
                          <FaPlay />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materiales y observaciones */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materiales utilizados */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Materiales Utilizados</h3>
          <div className="space-y-3">
            {ordenesAcabados.filter(o => o.materiales).map((orden) => (
              <div key={orden.id} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">{orden.numeroOrden}</span>
                  <span className="text-sm text-gray-600">- {orden.proceso}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {orden.materiales.map((material, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Observaciones de Acabados</h3>
          <div className="space-y-3">
            {ordenesAcabados.filter(o => o.observaciones).map((orden) => (
              <div key={orden.id} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{orden.numeroOrden}</span>
                  <span className="text-sm text-gray-600">- {orden.cliente}</span>
                </div>
                <p className="text-sm text-gray-700">{orden.observaciones}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloAcabados;