import React, { useState, useEffect } from 'react';
import { 
  FaRegLightbulb, 
  FaArrowUp, 
  FaArrowDown, 
  FaCheckCircle, 
  FaClock, 
  FaTimes, 
  FaHourglassHalf, 
  FaAward 
} from 'react-icons/fa';

const MetricasInnovacion = () => {
  const [metricasInnovacion, setMetricasInnovacion] = useState({});

  useEffect(() => {
    // Simular datos de métricas de innovación
    const datosFicticios = {
      ideasGeneradas: 25,
      ideasImplementadas: 8,
      ideasEnEvaluacion: 5,
      ideasRechazadas: 12,
      tasaImplementacion: 32,
      ahorroGenerado: 15000,
      tiempoAhorrado: 120,
      eficienciaMejorada: 15,
      tendencias: {
        ideasGeneradas: 'up',
        ideasImplementadas: 'up',
        ahorroGenerado: 'up',
        tiempoAhorrado: 'up'
      },
      cambios: {
        ideasGeneradas: 5,
        ideasImplementadas: 2,
        ahorroGenerado: 3000,
        tiempoAhorrado: 20
      },
      ideasRecientes: [
        {
          id: 1,
          titulo: 'Automatización de Preprensa',
          descripcion: 'Implementar sistema automático para revisión de archivos',
          estado: 'implementada',
          ahorro: 5000,
          tiempoAhorrado: 40,
          responsable: 'Juan Pérez',
          fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          titulo: 'Optimización de Tintas',
          descripcion: 'Usar tintas más eficientes para reducir costos',
          estado: 'en_evaluacion',
          ahorro: 3000,
          tiempoAhorrado: 15,
          responsable: 'María García',
          fecha: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        },
        {
          id: 3,
          titulo: 'Sistema de Alertas Inteligentes',
          descripcion: 'Alertas automáticas para órdenes próximas a vencer',
          estado: 'implementada',
          ahorro: 2000,
          tiempoAhorrado: 25,
          responsable: 'Carlos López',
          fecha: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
        }
      ],
      areasInnovacion: [
        { area: 'Preprensa', ideas: 8, implementadas: 3, ahorro: 6000 },
        { area: 'Prensa', ideas: 6, implementadas: 2, ahorro: 4000 },
        { area: 'Acabados', ideas: 4, implementadas: 2, ahorro: 3000 },
        { area: 'Calidad', ideas: 3, implementadas: 1, ahorro: 2000 },
        { area: 'Administración', ideas: 4, implementadas: 0, ahorro: 0 }
      ],
      innovadoresTop: [
        { nombre: 'Juan Pérez', ideas: 5, implementadas: 2, ahorro: 7000 },
        { nombre: 'María García', ideas: 4, implementadas: 2, ahorro: 4000 },
        { nombre: 'Carlos López', ideas: 3, implementadas: 2, ahorro: 3000 }
      ]
    };
    
    setMetricasInnovacion(datosFicticios);
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

  const getEstadoColor = (estado) => {
    const colores = {
      implementada: 'bg-green-50 border-green-200 text-green-800',
      en_evaluacion: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      rechazada: 'bg-red-50 border-red-200 text-red-800',
      pendiente: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return colores[estado] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      implementada: <FaCheckCircle className="text-green-500" />,
      en_evaluacion: <FaClock className="text-yellow-500" />,
      rechazada: <FaTimes className="text-red-500" />,
      pendiente: <FaHourglassHalf className="text-blue-500" />
    };
    return iconos[estado] || <FaClock className="text-gray-500" />;
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(valor);
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const dias = Math.floor(diferencia / (24 * 60 * 60 * 1000));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
      <FaRegLightbulb className="text-blue-600" />
        Métricas de Innovación
      </h3>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Ideas Generadas</span>
            {getTendenciaIcono(metricasInnovacion.tendencias?.ideasGeneradas)}
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {metricasInnovacion.ideasGeneradas}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            <span className={getTendenciaColor(metricasInnovacion.tendencias?.ideasGeneradas)}>
              {metricasInnovacion.cambios?.ideasGeneradas > 0 ? '+' : ''}{metricasInnovacion.cambios?.ideasGeneradas} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Implementadas</span>
            {getTendenciaIcono(metricasInnovacion.tendencias?.ideasImplementadas)}
          </div>
          <div className="text-2xl font-bold text-green-800">
            {metricasInnovacion.ideasImplementadas}
          </div>
          <div className="text-sm text-green-600 mt-1">
            <span className={getTendenciaColor(metricasInnovacion.tendencias?.ideasImplementadas)}>
              {metricasInnovacion.cambios?.ideasImplementadas > 0 ? '+' : ''}{metricasInnovacion.cambios?.ideasImplementadas} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Ahorro Generado</span>
            {getTendenciaIcono(metricasInnovacion.tendencias?.ahorroGenerado)}
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {formatearMoneda(metricasInnovacion.ahorroGenerado)}
          </div>
          <div className="text-sm text-purple-600 mt-1">
            <span className={getTendenciaColor(metricasInnovacion.tendencias?.ahorroGenerado)}>
              {metricasInnovacion.cambios?.ahorroGenerado > 0 ? '+' : ''}{formatearMoneda(metricasInnovacion.cambios?.ahorroGenerado)} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700">Tiempo Ahorrado</span>
            {getTendenciaIcono(metricasInnovacion.tendencias?.tiempoAhorrado)}
          </div>
          <div className="text-2xl font-bold text-orange-800">
            {metricasInnovacion.tiempoAhorrado} horas
          </div>
          <div className="text-sm text-orange-600 mt-1">
            <span className={getTendenciaColor(metricasInnovacion.tendencias?.tiempoAhorrado)}>
              {metricasInnovacion.cambios?.tiempoAhorrado > 0 ? '+' : ''}{metricasInnovacion.cambios?.tiempoAhorrado} horas vs mes anterior
            </span>
          </div>
        </div>
      </div>

      {/* Ideas recientes */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Ideas Recientes</h4>
        <div className="space-y-3">
          {metricasInnovacion.ideasRecientes?.map((idea) => (
            <div key={idea.id} className={`p-4 rounded-lg border-l-4 ${getEstadoColor(idea.estado)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getEstadoIcono(idea.estado)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {idea.titulo}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(idea.estado)}`}>
                      {idea.estado.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatearFecha(idea.fecha)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{idea.descripcion}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Ahorro: {formatearMoneda(idea.ahorro)}</span>
                    <span>Tiempo: {idea.tiempoAhorrado} horas</span>
                    <span>Responsable: {idea.responsable}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Áreas de innovación */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Innovación por Área</h4>
          <div className="space-y-3">
            {metricasInnovacion.areasInnovacion?.map((area, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{area.area}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {area.ideas} ideas
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {area.implementadas} implementadas, {area.ahorro > 0 ? formatearMoneda(area.ahorro) : 'Sin ahorro'}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(area.implementadas / area.ideas) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Innovadores top */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Innovadores Top</h4>
          <div className="space-y-3">
            {metricasInnovacion.innovadoresTop?.map((innovador, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaAward className={`text-${index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}-500`} />
                    <span className="font-medium text-gray-800">{innovador.nombre}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    #{index + 1}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Ideas:</span>
                    <span className="font-medium text-blue-600 ml-1">{innovador.ideas}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Implementadas:</span>
                    <span className="font-medium text-green-600 ml-1">{innovador.implementadas}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ahorro:</span>
                    <span className="font-medium text-purple-600 ml-1">{formatearMoneda(innovador.ahorro)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de innovación */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-2">Resumen de Innovación</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {metricasInnovacion.tasaImplementacion}%
              </div>
              <div className="text-gray-600">Tasa de Implementación</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {formatearMoneda(metricasInnovacion.ahorroGenerado)}
              </div>
              <div className="text-gray-600">Ahorro Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {metricasInnovacion.tiempoAhorrado} horas
              </div>
              <div className="text-gray-600">Tiempo Ahorrado</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasInnovacion;
