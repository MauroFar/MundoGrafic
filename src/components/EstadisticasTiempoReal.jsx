import React, { useState, useEffect } from 'react';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaShieldAlt, 
  FaCheckCircle, 
  FaClock, 
  FaTimes, 
  FaHourglassHalf, 
  FaStar, 
  FaAward, 
  FaSmile, 
  FaMeh, 
  FaFrown 
} from 'react-icons/fa';
import { FaChartBar } from 'react-icons/fa'; // reemplaza FaChartLine



const EstadisticasTiempoReal = () => {
  const [estadisticas, setEstadisticas] = useState({
    eficiencia: 85,
    tiempoPromedio: 2.5,
    ordenesCompletadasHoy: 7,
    ordenesEnProceso: 18,
    tendencia: 'up'
  });

  useEffect(() => {
    // Simular actualización de estadísticas en tiempo real
    const interval = setInterval(() => {
      setEstadisticas(prev => ({
        ...prev,
        eficiencia: Math.max(70, Math.min(95, prev.eficiencia + (Math.random() - 0.5) * 2)),
        tiempoPromedio: Math.max(1.5, Math.min(4, prev.tiempoPromedio + (Math.random() - 0.5) * 0.2)),
        ordenesCompletadasHoy: prev.ordenesCompletadasHoy + (Math.random() > 0.8 ? 1 : 0),
        ordenesEnProceso: prev.ordenesEnProceso + (Math.random() > 0.9 ? 1 : 0) - (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' 
      ? <FaArrowUp className="text-green-500" /> 
      : <FaArrowDown className="text-red-500" />;
  };


  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
  <FaChartBar className="text-blue-600" />  {/* reemplaza FaChartLine */}
  Estadísticas en Tiempo Real
</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Eficiencia */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Eficiencia</span>
            {getTendenciaIcono(estadisticas.tendencia)}
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {Math.round(estadisticas.eficiencia)}%
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${estadisticas.eficiencia}%` }}
            ></div>
          </div>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Tiempo Promedio</span>
            <FaClock className="text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-800">
            {estadisticas.tiempoPromedio.toFixed(1)} días
          </div>
          <div className="text-sm text-green-600 mt-1">
            Por orden completada
          </div>
        </div>

        {/* Órdenes Completadas Hoy */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Completadas Hoy</span>
            <FaCheckCircle className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {estadisticas.ordenesCompletadasHoy}
          </div>
          <div className="text-sm text-purple-600 mt-1">
            Órdenes terminadas
          </div>
        </div>

        {/* Órdenes En Proceso */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700">En Proceso</span>
            <FaClock className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-800">
            {estadisticas.ordenesEnProceso}
          </div>
          <div className="text-sm text-orange-600 mt-1">
            Órdenes activas
          </div>
        </div>
      </div>

      {/* Indicador de actualización en tiempo real */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Actualización en tiempo real</span>
      </div>
    </div>
  );
};

export default EstadisticasTiempoReal;
