import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, FaCheckCircle, FaClock, FaTimes, FaHourglassHalf, 
  FaStar, FaAward, FaSmile, FaMeh, FaFrown, 
  FaExclamationTriangle, FaArrowUp, FaArrowDown 
} from 'react-icons/fa';





const MetricasSeguridad = () => {
  const [metricasSeguridad, setMetricasSeguridad] = useState({});

  useEffect(() => {
    // Simular datos de métricas de seguridad
    const datosFicticios = {
      incidentesSeguridad: 2,
      incidentesResueltos: 2,
      tiempoResolucionPromedio: 4,
      capacitacionesRealizadas: 15,
      empleadosCapacitados: 25,
      tendencias: {
        incidentesSeguridad: 'down',
        incidentesResueltos: 'up',
        tiempoResolucionPromedio: 'down',
        capacitacionesRealizadas: 'up',
        empleadosCapacitados: 'up'
      },
      cambios: {
        incidentesSeguridad: -1,
        incidentesResueltos: 1,
        tiempoResolucionPromedio: -2,
        capacitacionesRealizadas: 3,
        empleadosCapacitados: 5
      },
      incidentesRecientes: [
        {
          id: 1,
          titulo: 'Accidente Menor en Prensa',
          descripcion: 'Corte menor en dedo durante cambio de papel',
          severidad: 'baja',
          estado: 'resuelto',
          fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          responsable: 'Carlos López'
        },
        {
          id: 2,
          titulo: 'Derrame de Tinta',
          descripcion: 'Pequeño derrame de tinta en área de trabajo',
          severidad: 'media',
          estado: 'resuelto',
          fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          responsable: 'María García'
        }
      ],
      areasSeguridad: [
        { area: 'Preprensa', incidentes: 0, capacitaciones: 3, empleados: 5 },
        { area: 'Prensa', incidentes: 1, capacitaciones: 4, empleados: 8 },
        { area: 'Acabados', incidentes: 1, capacitaciones: 3, empleados: 6 },
        { area: 'Calidad', incidentes: 0, capacitaciones: 2, empleados: 4 },
        { area: 'Empacado', incidentes: 0, capacitaciones: 2, empleados: 3 },
        { area: 'Entrega', incidentes: 0, capacitaciones: 1, empleados: 2 }
      ],
      capacitacionesRecientes: [
        {
          id: 1,
          titulo: 'Seguridad en Prensa',
          descripcion: 'Capacitación sobre procedimientos de seguridad en máquinas de impresión',
          participantes: 8,
          fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          instructor: 'Juan Pérez'
        },
        {
          id: 2,
          titulo: 'Manejo de Sustancias Químicas',
          descripcion: 'Capacitación sobre manejo seguro de tintas y productos químicos',
          participantes: 12,
          fecha: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          instructor: 'Ana Martínez'
        },
        {
          id: 3,
          titulo: 'Primeros Auxilios',
          descripcion: 'Capacitación básica en primeros auxilios para todo el personal',
          participantes: 25,
          fecha: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          instructor: 'Roberto Silva'
        }
      ],
      objetivosSeguridad: [
        { objetivo: 'Cero Accidentes Graves', progreso: 100, meta: 100, fecha: '2024-12-31' },
        { objetivo: 'Capacitar 100% del Personal', progreso: 100, meta: 100, fecha: '2024-06-30' },
        { objetivo: 'Reducir Tiempo de Resolución', progreso: 80, meta: 50, fecha: '2024-12-31' },
        { objetivo: 'Implementar Nuevos Protocolos', progreso: 60, meta: 100, fecha: '2024-12-31' }
      ]
    };
    
    setMetricasSeguridad(datosFicticios);
  }, []);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' 
      ? <FaArrowUp className="text-green-500" /> 
      : <FaArrowDown className="text-red-500" />;
  };

  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTendenciaBgColor = (tendencia) => {
    return tendencia === 'up' ? 'bg-green-100' : 'bg-red-100';
  };

  const getSeveridadColor = (severidad) => {
    const colores = {
      baja: 'bg-green-50 border-green-200 text-green-800',
      media: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      alta: 'bg-red-50 border-red-200 text-red-800',
      critica: 'bg-red-50 border-red-200 text-red-800'
    };
    return colores[severidad] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getSeveridadIcono = (severidad) => {
    const iconos = {
      baja: <FaCheckCircle className="text-green-500" />,
      media: <FaExclamationTriangle className="text-yellow-500" />,
      alta: <FaExclamationTriangle className="text-red-500" />,
      critica: <FaExclamationTriangle className="text-red-500" />
    };
    return iconos[severidad] || <FaExclamationTriangle className="text-gray-500" />;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      resuelto: 'bg-green-50 border-green-200 text-green-800',
      en_progreso: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      pendiente: 'bg-red-50 border-red-200 text-red-800',
      investigando: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return colores[estado] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      resuelto: <FaCheckCircle className="text-green-500" />,
      en_progreso: <FaClock className="text-yellow-500" />,
      pendiente: <FaExclamationTriangle className="text-red-500" />,
      investigando: <FaEye className="text-blue-500" />
    };
    return iconos[estado] || <FaClock className="text-gray-500" />;
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const dias = Math.floor(diferencia / (24 * 60 * 60 * 1000));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  };

  const getProgresoColor = (progreso, meta) => {
    const porcentaje = (progreso / meta) * 100;
    if (porcentaje >= 80) return 'bg-green-600';
    if (porcentaje >= 60) return 'bg-blue-600';
    if (porcentaje >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
  <FaShieldAlt className="text-blue-600" />
  Métricas de Seguridad
</h3>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Incidentes</span>
            {getTendenciaIcono(metricasSeguridad.tendencias?.incidentesSeguridad)}
          </div>
          <div className="text-2xl font-bold text-red-800">
            {metricasSeguridad.incidentesSeguridad}
          </div>
          <div className="text-sm text-red-600 mt-1">
            <span className={getTendenciaColor(metricasSeguridad.tendencias?.incidentesSeguridad)}>
              {metricasSeguridad.cambios?.incidentesSeguridad > 0 ? '+' : ''}{metricasSeguridad.cambios?.incidentesSeguridad} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Resueltos</span>
            {getTendenciaIcono(metricasSeguridad.tendencias?.incidentesResueltos)}
          </div>
          <div className="text-2xl font-bold text-green-800">
            {metricasSeguridad.incidentesResueltos}
          </div>
          <div className="text-sm text-green-600 mt-1">
            <span className={getTendenciaColor(metricasSeguridad.tendencias?.incidentesResueltos)}>
              {metricasSeguridad.cambios?.incidentesResueltos > 0 ? '+' : ''}{metricasSeguridad.cambios?.incidentesResueltos} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Tiempo Resolución</span>
            {getTendenciaIcono(metricasSeguridad.tendencias?.tiempoResolucionPromedio)}
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {metricasSeguridad.tiempoResolucionPromedio}h
          </div>
          <div className="text-sm text-blue-600 mt-1">
            <span className={getTendenciaColor(metricasSeguridad.tendencias?.tiempoResolucionPromedio)}>
              {metricasSeguridad.cambios?.tiempoResolucionPromedio > 0 ? '+' : ''}{metricasSeguridad.cambios?.tiempoResolucionPromedio}h vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Capacitaciones</span>
            {getTendenciaIcono(metricasSeguridad.tendencias?.capacitacionesRealizadas)}
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {metricasSeguridad.capacitacionesRealizadas}
          </div>
          <div className="text-sm text-purple-600 mt-1">
            <span className={getTendenciaColor(metricasSeguridad.tendencias?.capacitacionesRealizadas)}>
              {metricasSeguridad.cambios?.capacitacionesRealizadas > 0 ? '+' : ''}{metricasSeguridad.cambios?.capacitacionesRealizadas} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700">Empleados</span>
            {getTendenciaIcono(metricasSeguridad.tendencias?.empleadosCapacitados)}
          </div>
          <div className="text-2xl font-bold text-orange-800">
            {metricasSeguridad.empleadosCapacitados}
          </div>
          <div className="text-sm text-orange-600 mt-1">
            <span className={getTendenciaColor(metricasSeguridad.tendencias?.empleadosCapacitados)}>
              {metricasSeguridad.cambios?.empleadosCapacitados > 0 ? '+' : ''}{metricasSeguridad.cambios?.empleadosCapacitados} vs mes anterior
            </span>
          </div>
        </div>
      </div>

      {/* Incidentes recientes */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Incidentes Recientes</h4>
        <div className="space-y-3">
          {metricasSeguridad.incidentesRecientes?.map((incidente) => (
            <div key={incidente.id} className={`p-4 rounded-lg border-l-4 ${getSeveridadColor(incidente.severidad)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getSeveridadIcono(incidente.severidad)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {incidente.titulo}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeveridadColor(incidente.severidad)}`}>
                      {incidente.severidad}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(incidente.estado)}`}>
                      {incidente.estado}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatearFecha(incidente.fecha)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{incidente.descripcion}</p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Responsable:</span> {incidente.responsable}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Áreas de seguridad */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Seguridad por Área</h4>
          <div className="space-y-3">
            {metricasSeguridad.areasSeguridad?.map((area, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{area.area}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {area.incidentes} incidentes
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {area.capacitaciones} capacitaciones, {area.empleados} empleados
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(area.capacitaciones / area.empleados) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capacitaciones recientes */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Capacitaciones Recientes</h4>
          <div className="space-y-3">
            {metricasSeguridad.capacitacionesRecientes?.map((capacitacion) => (
              <div key={capacitacion.id} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{capacitacion.titulo}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {capacitacion.participantes} participantes
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{capacitacion.descripcion}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Instructor: {capacitacion.instructor}</span>
                  <span>{formatearFecha(capacitacion.fecha)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Objetivos de seguridad */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Objetivos de Seguridad</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metricasSeguridad.objetivosSeguridad?.map((objetivo, index) => (
            <div key={index} className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{objetivo.objetivo}</span>
                <span className="text-sm font-bold text-gray-800">
                  {objetivo.progreso}/{objetivo.meta}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgresoColor(objetivo.progreso, objetivo.meta)}`}
                  style={{ width: `${(objetivo.progreso / objetivo.meta) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600">
                Meta: {new Date(objetivo.fecha).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de seguridad */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-2">Resumen de Seguridad</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {metricasSeguridad.incidentesSeguridad}
              </div>
              <div className="text-gray-600">Incidentes Totales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {metricasSeguridad.incidentesResueltos}
              </div>
              <div className="text-gray-600">Incidentes Resueltos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {metricasSeguridad.capacitacionesRealizadas}
              </div>
              <div className="text-gray-600">Capacitaciones Realizadas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasSeguridad;
