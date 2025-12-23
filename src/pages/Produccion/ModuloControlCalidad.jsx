import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaEye, FaClipboardCheck, FaRuler, FaMicroscope } from 'react-icons/fa';

const ModuloControlCalidad = () => {
  const [inspecciones, setInspecciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarInspecciones();
  }, []);

  const cargarInspecciones = () => {
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
          estado: 'aprobado',
          inspector: 'Carlos López',
          fechaInspeccion: new Date(Date.now() - 2 * 60 * 60 * 1000),
          tipoInspeccion: 'Final',
          resultado: 'Aprobado',
          observaciones: 'Calidad excelente, colores dentro de especificaciones',
          defectos: [],
          mediciones: {
            dimensiones: '8.5 x 5.5 cm (±0.1mm)',
            color: 'Dentro de especificaciones',
            acabado: 'Uniforme',
            gramaje: '300g/m²'
          },
          fotos: ['inspeccion_001_1.jpg', 'inspeccion_001_2.jpg']
        },
        {
          id: 2,
          numeroOrden: 'OT-2024-002',
          cliente: 'Comercial XYZ',
          producto: 'Volantes Promocionales',
          cantidad: 5000,
          estado: 'rechazado',
          inspector: 'María García',
          fechaInspeccion: new Date(Date.now() - 1 * 60 * 60 * 1000),
          tipoInspeccion: 'Muestreo',
          resultado: 'Rechazado',
          observaciones: 'Desalineación en el corte, fuera de tolerancia',
          defectos: [
            { tipo: 'Desalineación', severidad: 'alta', cantidad: 15 },
            { tipo: 'Manchas', severidad: 'media', cantidad: 3 }
          ],
          mediciones: {
            dimensiones: '21 x 29.7 cm (±0.2mm)',
            color: 'Fuera de especificaciones',
            acabado: 'Irregular',
            gramaje: '80g/m²'
          },
          fotos: ['inspeccion_002_1.jpg', 'inspeccion_002_2.jpg']
        },
        {
          id: 3,
          numeroOrden: 'OT-2024-003',
          cliente: 'Restaurante El Buen Sabor',
          producto: 'Menús',
          cantidad: 200,
          estado: 'pendiente',
          inspector: 'Ana Martínez',
          fechaInspeccion: null,
          tipoInspeccion: 'Final',
          resultado: 'Pendiente',
          observaciones: 'Esperando inspección final',
          defectos: [],
          mediciones: {},
          fotos: []
        }
      ];
      
      setInspecciones(datosFicticios);
      setCargando(false);
    }, 1000);
  };

  const cambiarEstadoInspeccion = (id, nuevoEstado) => {
    setInspecciones(prev => 
      prev.map(inspeccion => 
        inspeccion.id === id 
          ? { 
              ...inspeccion, 
              estado: nuevoEstado,
              resultado: nuevoEstado === 'aprobado' ? 'Aprobado' : nuevoEstado === 'rechazado' ? 'Rechazado' : 'Pendiente',
              fechaInspeccion: nuevoEstado !== 'pendiente' ? new Date() : inspeccion.fechaInspeccion
            }
          : inspeccion
      )
    );

    // Disparar notificación
    const evento = new CustomEvent('nueva-notificacion', {
      detail: {
        tipo: nuevoEstado === 'aprobado' ? 'success' : 'error',
        titulo: 'Inspección Actualizada',
        mensaje: `Inspección ${id} ${nuevoEstado === 'aprobado' ? 'aprobada' : 'rechazada'}`
      }
    });
    window.dispatchEvent(evento);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      aprobado: 'bg-green-50 border-green-200 text-green-800',
      rechazado: 'bg-red-50 border-red-200 text-red-800',
      en_revision: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return colores[estado] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      pendiente: <FaExclamationTriangle className="text-yellow-500" />,
      aprobado: <FaCheckCircle className="text-green-500" />,
      rechazado: <FaTimesCircle className="text-red-500" />,
      en_revision: <FaEye className="text-blue-500" />
    };
    return iconos[estado] || <FaExclamationTriangle className="text-gray-500" />;
  };

  const getTipoInspeccionColor = (tipo) => {
    const colores = {
      'Final': 'bg-green-100 text-green-800',
      'Muestreo': 'bg-blue-100 text-blue-800',
      'Inicial': 'bg-yellow-100 text-yellow-800',
      'Proceso': 'bg-purple-100 text-purple-800'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getSeveridadColor = (severidad) => {
    const colores = {
      baja: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-red-100 text-red-800',
      critica: 'bg-red-100 text-red-800'
    };
    return colores[severidad] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No realizada';
    return fecha.toLocaleString();
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
          <FaClipboardCheck className="text-green-600" />
          Control de Calidad
        </h2>
        <button
          onClick={cargarInspecciones}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {inspecciones.filter(i => i.estado === 'aprobado').length}
          </div>
          <div className="text-sm text-green-800">Aprobadas</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {inspecciones.filter(i => i.estado === 'rechazado').length}
          </div>
          <div className="text-sm text-red-800">Rechazadas</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {inspecciones.filter(i => i.estado === 'pendiente').length}
          </div>
          <div className="text-sm text-yellow-800">Pendientes</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {inspecciones.length}
          </div>
          <div className="text-sm text-blue-800">Total Inspecciones</div>
        </div>
      </div>

      {/* Lista de inspecciones */}
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
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inspecciones.map((inspeccion) => (
                <tr key={inspeccion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {inspeccion.numeroOrden}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspeccion.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspeccion.producto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspeccion.cantidad.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTipoInspeccionColor(inspeccion.tipoInspeccion)}`}>
                      {inspeccion.tipoInspeccion}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getEstadoIcono(inspeccion.estado)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(inspeccion.estado)}`}>
                        {inspeccion.estado}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspeccion.inspector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(inspeccion.fechaInspeccion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {inspeccion.estado === 'pendiente' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoInspeccion(inspeccion.id, 'aprobado')}
                            className="text-green-600 hover:text-green-900"
                            title="Aprobar"
                          >
                            <FaCheckCircle />
                          </button>
                          <button
                            onClick={() => cambiarEstadoInspeccion(inspeccion.id, 'rechazado')}
                            className="text-red-600 hover:text-red-900"
                            title="Rechazar"
                          >
                            <FaTimesCircle />
                          </button>
                        </>
                      )}
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver Detalles"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalles de inspecciones */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mediciones */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaRuler className="text-blue-600" />
            Mediciones y Especificaciones
          </h3>
          <div className="space-y-3">
            {inspecciones.filter(i => Object.keys(i.mediciones).length > 0).map((inspeccion) => (
              <div key={inspeccion.id} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">{inspeccion.numeroOrden}</span>
                  <span className="text-sm text-gray-600">- {inspeccion.producto}</span>
                </div>
                <div className="space-y-1 text-sm">
                  {Object.entries(inspeccion.mediciones).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key}:</span>
                      <span className="text-gray-800 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defectos encontrados */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-600" />
            Defectos Encontrados
          </h3>
          <div className="space-y-3">
            {inspecciones.filter(i => i.defectos && i.defectos.length > 0).map((inspeccion) => (
              <div key={inspeccion.id} className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">{inspeccion.numeroOrden}</span>
                  <span className="text-sm text-gray-600">- {inspeccion.cliente}</span>
                </div>
                <div className="space-y-2">
                  {inspeccion.defectos.map((defecto, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{defecto.tipo}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeveridadColor(defecto.severidad)}`}>
                          {defecto.severidad}
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {defecto.cantidad} unidades
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Observaciones de Inspección</h3>
        <div className="space-y-3">
          {inspecciones.filter(i => i.observaciones).map((inspeccion) => (
            <div key={inspeccion.id} className={`p-3 border-l-4 rounded ${
              inspeccion.estado === 'aprobado' ? 'bg-green-50 border-green-400' :
              inspeccion.estado === 'rechazado' ? 'bg-red-50 border-red-400' :
              'bg-yellow-50 border-yellow-400'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">{inspeccion.numeroOrden}</span>
                <span className="text-sm text-gray-600">- {inspeccion.cliente}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(inspeccion.estado)}`}>
                  {inspeccion.estado}
                </span>
              </div>
              <p className="text-sm text-gray-700">{inspeccion.observaciones}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuloControlCalidad;