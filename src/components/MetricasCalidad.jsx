import React, { useState, useEffect } from 'react';
import { FaSearch, FaCheckCircle, FaExclamationTriangle, FaChartLine, FaAward, FaTimes } from 'react-icons/fa';

const MetricasCalidad = () => {
  const [metricasCalidad, setMetricasCalidad] = useState({});

  useEffect(() => {
    // Simular datos de métricas de calidad
    const datosFicticios = {
      ordenesInspeccionadas: 25,
      ordenesAprobadas: 23,
      ordenesRechazadas: 2,
      tasaAprobacion: 92,
      defectosEncontrados: 5,
      defectosCriticos: 1,
      defectosMenores: 4,
      tiempoInspeccionPromedio: 15,
      areasConProblemas: [
        { area: 'Prensa', defectos: 3, criticos: 1 },
        { area: 'Acabados', defectos: 2, criticos: 0 }
      ],
      tendencias: {
        tasaAprobacion: 'up',
        defectos: 'down',
        tiempoInspeccion: 'down'
      },
      cambios: {
        tasaAprobacion: 5,
        defectos: -2,
        tiempoInspeccion: -3
      },
      inspeccionesRecientes: [
        {
          id: 1,
          orden: 'OT-2024-001',
          inspector: 'Ana Martínez',
          resultado: 'aprobada',
          defectos: 0,
          tiempo: 12,
          fecha: new Date(Date.now() - 30 * 60000)
        },
        {
          id: 2,
          orden: 'OT-2024-002',
          inspector: 'Pedro González',
          resultado: 'rechazada',
          defectos: 2,
          tiempo: 18,
          fecha: new Date(Date.now() - 60 * 60000)
        },
        {
          id: 3,
          orden: 'OT-2024-003',
          inspector: 'Ana Martínez',
          resultado: 'aprobada',
          defectos: 0,
          tiempo: 14,
          fecha: new Date(Date.now() - 90 * 60000)
        }
      ]
    };
    
    setMetricasCalidad(datosFicticios);
  }, []);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' ? <FaChartLine className="text-green-500" /> : <FaChartLine className="text-red-500" />;
  };

  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTendenciaBgColor = (tendencia) => {
    return tendencia === 'up' ? 'bg-green-100' : 'bg-red-100';
  };

  const getResultadoColor = (resultado) => {
    const colores = {
      aprobada: 'bg-green-50 border-green-200 text-green-800',
      rechazada: 'bg-red-50 border-red-200 text-red-800',
      pendiente: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };
    return colores[resultado] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getResultadoIcono = (resultado) => {
    const iconos = {
      aprobada: <FaCheckCircle className="text-green-500" />,
      rechazada: <FaTimes className="text-red-500" />,
      pendiente: <FaExclamationTriangle className="text-yellow-500" />
    };
    return iconos[resultado] || <FaExclamationTriangle className="text-gray-500" />;
  };

  const formatearTiempo = (timestamp) => {
    const ahora = new Date();
    const diferencia = ahora - timestamp;
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);

    if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'ahora';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaSearch className="text-blue-600" />
        Métricas de Calidad
      </h3>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Tasa de Aprobación</span>
            {getTendenciaIcono(metricasCalidad.tendencias?.tasaAprobacion)}
          </div>
          <div className="text-2xl font-bold text-green-800">
            {metricasCalidad.tasaAprobacion}%
          </div>
          <div className="text-sm text-green-600 mt-1">
            <span className={getTendenciaColor(metricasCalidad.tendencias?.tasaAprobacion)}>
              {metricasCalidad.cambios?.tasaAprobacion > 0 ? '+' : ''}{metricasCalidad.cambios?.tasaAprobacion}% vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Inspecciones</span>
            <FaSearch className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {metricasCalidad.ordenesInspeccionadas}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {metricasCalidad.ordenesAprobadas} aprobadas, {metricasCalidad.ordenesRechazadas} rechazadas
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Defectos</span>
            {getTendenciaIcono(metricasCalidad.tendencias?.defectos)}
          </div>
          <div className="text-2xl font-bold text-red-800">
            {metricasCalidad.defectosEncontrados}
          </div>
          <div className="text-sm text-red-600 mt-1">
            {metricasCalidad.defectosCriticos} críticos, {metricasCalidad.defectosMenores} menores
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Tiempo Promedio</span>
            {getTendenciaIcono(metricasCalidad.tendencias?.tiempoInspeccion)}
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {metricasCalidad.tiempoInspeccionPromedio} min
          </div>
          <div className="text-sm text-purple-600 mt-1">
            <span className={getTendenciaColor(metricasCalidad.tendencias?.tiempoInspeccion)}>
              {metricasCalidad.cambios?.tiempoInspeccion > 0 ? '+' : ''}{metricasCalidad.cambios?.tiempoInspeccion} min vs mes anterior
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Áreas con problemas */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Áreas con Problemas</h4>
          <div className="space-y-3">
            {metricasCalidad.areasConProblemas?.map((area, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-800">{area.area}</span>
                  <span className="text-sm text-red-600">
                    {area.defectos} defectos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">
                    {area.criticos} críticos, {area.defectos - area.criticos} menores
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspecciones recientes */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Inspecciones Recientes</h4>
          <div className="space-y-3">
            {metricasCalidad.inspeccionesRecientes?.map((inspeccion) => (
              <div key={inspeccion.id} className={`p-3 rounded-lg border-l-4 ${getResultadoColor(inspeccion.resultado)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getResultadoIcono(inspeccion.resultado)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {inspeccion.orden}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getResultadoColor(inspeccion.resultado)}`}>
                        {inspeccion.resultado}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Inspector: {inspeccion.inspector}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{inspeccion.tiempo} min</span>
                      <span>{inspeccion.defectos} defectos</span>
                      <span>{formatearTiempo(inspeccion.fecha)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de calidad */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-2">Resumen de Calidad</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {metricasCalidad.tasaAprobacion}%
              </div>
              <div className="text-gray-600">Tasa de Aprobación</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {metricasCalidad.ordenesInspeccionadas}
              </div>
              <div className="text-gray-600">Inspecciones Realizadas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {metricasCalidad.tiempoInspeccionPromedio} min
              </div>
              <div className="text-gray-600">Tiempo Promedio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasCalidad;
