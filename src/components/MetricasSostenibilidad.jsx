import React, { useState, useEffect } from 'react';
import { 
  FaEnvira, 
  FaArrowUp, 
  FaArrowDown, 
  FaCheckCircle, 
  FaClock, 
  FaTimes, 
  FaHourglassHalf 
} from 'react-icons/fa';

const MetricasSostenibilidad = () => {
  const [metricasSostenibilidad, setMetricasSostenibilidad] = useState({});

  useEffect(() => {
    // Simular datos de métricas de sostenibilidad
    const datosFicticios = {
      papelReciclado: 85,
      aguaAhorrada: 1200,
      energiaRenovable: 60,
      residuosReducidos: 45,
      emisionesCO2: 25,
      tendencias: {
        papelReciclado: 'up',
        aguaAhorrada: 'up',
        energiaRenovable: 'up',
        residuosReducidos: 'up',
        emisionesCO2: 'down'
      },
      cambios: {
        papelReciclado: 5,
        aguaAhorrada: 200,
        energiaRenovable: 10,
        residuosReducidos: 8,
        emisionesCO2: -5
      },
      iniciativasVerdes: [
        {
          id: 1,
          titulo: 'Programa de Reciclaje de Papel',
          descripcion: 'Implementación de sistema de reciclaje de papel usado',
          impacto: 'Reducción del 30% en residuos de papel',
          estado: 'activa',
          fecha: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          titulo: 'Optimización de Agua',
          descripcion: 'Sistema de recirculación de agua en procesos de limpieza',
          impacto: 'Ahorro de 200 litros por día',
          estado: 'activa',
          fecha: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
        },
        {
          id: 3,
          titulo: 'Energía Solar',
          descripcion: 'Instalación de paneles solares para reducir consumo eléctrico',
          impacto: 'Reducción del 40% en consumo eléctrico',
          estado: 'en_progreso',
          fecha: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        }
      ],
      areasSostenibilidad: [
        { area: 'Papel', porcentaje: 85, tendencia: 'up', cambio: 5 },
        { area: 'Agua', porcentaje: 70, tendencia: 'up', cambio: 8 },
        { area: 'Energía', porcentaje: 60, tendencia: 'up', cambio: 10 },
        { area: 'Residuos', porcentaje: 45, tendencia: 'up', cambio: 8 },
        { area: 'Emisiones', porcentaje: 25, tendencia: 'down', cambio: -5 }
      ],
      objetivosSostenibilidad: [
        { objetivo: 'Papel 100% Reciclado', progreso: 85, meta: 100, fecha: '2024-12-31' },
        { objetivo: 'Reducir Agua 50%', progreso: 70, meta: 50, fecha: '2024-06-30' },
        { objetivo: 'Energía 80% Renovable', progreso: 60, meta: 80, fecha: '2024-12-31' },
        { objetivo: 'Cero Residuos', progreso: 45, meta: 100, fecha: '2025-12-31' }
      ]
    };
    
    setMetricasSostenibilidad(datosFicticios);
  }, []);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' ? <FaArrowUp className="text-green-500" /> : <FaArrowDown className="text-red-500" />;
  };

  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTendenciaBgColor = (tendencia) => {
    return tendencia === 'up' ? 'bg-green-100' : 'bg-red-100';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      activa: 'bg-green-50 border-green-200 text-green-800',
      en_progreso: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      completada: 'bg-blue-50 border-blue-200 text-blue-800',
      pendiente: 'bg-gray-50 border-gray-200 text-gray-800'
    };
    return colores[estado] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      activa: <FaCheckCircle className="text-green-500" />,
      en_progreso: <FaClock className="text-yellow-500" />,
      completada: <FaCheckCircle className="text-blue-500" />,
      pendiente: <FaHourglassHalf className="text-gray-500" />
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
  <FaEnvira className="text-green-600" />
  Métricas de Sostenibilidad
</h3>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Papel Reciclado</span>
            {getTendenciaIcono(metricasSostenibilidad.tendencias?.papelReciclado)}
          </div>
          <div className="text-2xl font-bold text-green-800">
            {metricasSostenibilidad.papelReciclado}%
          </div>
          <div className="text-sm text-green-600 mt-1">
            <span className={getTendenciaColor(metricasSostenibilidad.tendencias?.papelReciclado)}>
              {metricasSostenibilidad.cambios?.papelReciclado > 0 ? '+' : ''}{metricasSostenibilidad.cambios?.papelReciclado}% vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Agua Ahorrada</span>
            {getTendenciaIcono(metricasSostenibilidad.tendencias?.aguaAhorrada)}
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {metricasSostenibilidad.aguaAhorrada}L
          </div>
          <div className="text-sm text-blue-600 mt-1">
            <span className={getTendenciaColor(metricasSostenibilidad.tendencias?.aguaAhorrada)}>
              {metricasSostenibilidad.cambios?.aguaAhorrada > 0 ? '+' : ''}{metricasSostenibilidad.cambios?.aguaAhorrada}L vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-700">Energía Renovable</span>
            {getTendenciaIcono(metricasSostenibilidad.tendencias?.energiaRenovable)}
          </div>
          <div className="text-2xl font-bold text-yellow-800">
            {metricasSostenibilidad.energiaRenovable}%
          </div>
          <div className="text-sm text-yellow-600 mt-1">
            <span className={getTendenciaColor(metricasSostenibilidad.tendencias?.energiaRenovable)}>
              {metricasSostenibilidad.cambios?.energiaRenovable > 0 ? '+' : ''}{metricasSostenibilidad.cambios?.energiaRenovable}% vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Residuos Reducidos</span>
            {getTendenciaIcono(metricasSostenibilidad.tendencias?.residuosReducidos)}
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {metricasSostenibilidad.residuosReducidos}%
          </div>
          <div className="text-sm text-purple-600 mt-1">
            <span className={getTendenciaColor(metricasSostenibilidad.tendencias?.residuosReducidos)}>
              {metricasSostenibilidad.cambios?.residuosReducidos > 0 ? '+' : ''}{metricasSostenibilidad.cambios?.residuosReducidos}% vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Emisiones CO2</span>
            {getTendenciaIcono(metricasSostenibilidad.tendencias?.emisionesCO2)}
          </div>
          <div className="text-2xl font-bold text-red-800">
            {metricasSostenibilidad.emisionesCO2}%
          </div>
          <div className="text-sm text-red-600 mt-1">
            <span className={getTendenciaColor(metricasSostenibilidad.tendencias?.emisionesCO2)}>
              {metricasSostenibilidad.cambios?.emisionesCO2 > 0 ? '+' : ''}{metricasSostenibilidad.cambios?.emisionesCO2}% vs mes anterior
            </span>
          </div>
        </div>
      </div>

      {/* Iniciativas verdes */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Iniciativas Verdes</h4>
        <div className="space-y-3">
          {metricasSostenibilidad.iniciativasVerdes?.map((iniciativa) => (
            <div key={iniciativa.id} className={`p-4 rounded-lg border-l-4 ${getEstadoColor(iniciativa.estado)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getEstadoIcono(iniciativa.estado)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {iniciativa.titulo}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(iniciativa.estado)}`}>
                      {iniciativa.estado.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatearFecha(iniciativa.fecha)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{iniciativa.descripcion}</p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Impacto:</span> {iniciativa.impacto}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Áreas de sostenibilidad */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Áreas de Sostenibilidad</h4>
          <div className="space-y-3">
            {metricasSostenibilidad.areasSostenibilidad?.map((area, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{area.area}</span>
                  <div className="flex items-center gap-2">
                    {getTendenciaIcono(area.tendencia)}
                    <span className="text-sm font-bold text-gray-800">
                      {area.porcentaje}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgresoColor(area.porcentaje, 100)}`}
                    style={{ width: `${area.porcentaje}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className={getTendenciaColor(area.tendencia)}>
                    {area.cambio > 0 ? '+' : ''}{area.cambio}% vs mes anterior
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Objetivos de sostenibilidad */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Objetivos de Sostenibilidad</h4>
          <div className="space-y-3">
            {metricasSostenibilidad.objetivosSostenibilidad?.map((objetivo, index) => (
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
      </div>

      {/* Resumen de sostenibilidad */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-2">Resumen de Sostenibilidad</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {metricasSostenibilidad.papelReciclado}%
              </div>
              <div className="text-gray-600">Papel Reciclado</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {metricasSostenibilidad.aguaAhorrada}L
              </div>
              <div className="text-gray-600">Agua Ahorrada</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {metricasSostenibilidad.energiaRenovable}%
              </div>
              <div className="text-gray-600">Energía Renovable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasSostenibilidad;
